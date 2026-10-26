// tutaj sa funkcje do wyswietlania produktow i formularzy

import { Produkt, Kategoria } from "./types";
import { wczytajProdukty, dodajProdukt, aktualizujProdukt, usunProdukt } from "./storage";

// to trzyma aktualnie edytowany produkt albo null jak nie edytujemy
let edytowanyId: number | null = null;

// glowna funkcja ktora renderuje cala liste
export function renderujListe(fraza: string = ""): void {
    const kontener = document.getElementById("lista-produktow");
    if (!kontener) return;

    const produkty = wczytajProdukty();

    // filtruje po frazie wyszukiwania
    let wyniki = produkty;
    if (fraza.trim() !== "") {
        const f = fraza.toLowerCase();
        wyniki = produkty.filter(p =>
            p.nazwa.toLowerCase().includes(f) ||
            p.ean.includes(f) ||
            p.kategoria.toLowerCase().includes(f)
        );
    }

    if (wyniki.length === 0) {
        kontener.innerHTML = "<p class='brak'>Brak produktów na magazynie.</p>";
        return;
    }

    // buduje tabele z produktami
    let html = `
        <table>
            <thead>
                <tr>
                    <th>EAN</th>
                    <th>Nazwa</th>
                    <th>Kategoria</th>
                    <th>Miejsce</th>
                    <th>Ilość</th>
                    <th>Cena (zł)</th>
                    <th>Akcje</th>
                </tr>
            </thead>
            <tbody>
    `;

    for (const p of wyniki) {
        // dodaje klase ostrzezenia jak ilosc jest mala
        const wierszKlasa = p.ilosc <= 2 ? "mala-ilosc" : "";
        html += `
            <tr class="${wierszKlasa}">
                <td>${p.ean}</td>
                <td>${p.nazwa}</td>
                <td>${p.kategoria}</td>
                <td>${p.miejsce}</td>
                <td>${p.ilosc}</td>
                <td>${p.cena.toFixed(2)}</td>
                <td class="akcje">
                    <button onclick="edytuj(${p.id})">Edytuj</button>
                    <button class="usun-btn" onclick="usun(${p.id})">Usuń</button>
                </td>
            </tr>
        `;
    }

    html += "</tbody></table>";
    kontener.innerHTML = html;
}

// pokazuje formularz dodawania
export function pokazFormularzDodawania(): void {
    edytowanyId = null;
    const formularz = document.getElementById("formularz-kontener");
    const tytul = document.getElementById("formularz-tytul");
    if (!formularz || !tytul) return;

    tytul.textContent = "Dodaj nowy produkt";
    wypelnijFormularz(null);
    formularz.style.display = "block";
}

// wypelnia formularz danymi produktu albo czysci go
function wypelnijFormularz(produkt: Produkt | null): void {
    const pola = ["ean", "nazwa", "kategoria", "miejsce", "ilosc", "cena"];
    for (const pole of pola) {
        const el = document.getElementById(`pole-${pole}`) as HTMLInputElement | HTMLSelectElement | null;
        if (!el) continue;
        if (produkt === null) {
            el.value = "";
        } else {
            // to nie jest najelegantsze ale dziala
            const wartosc = produkt[pole as keyof Produkt];
            el.value = String(wartosc);
        }
    }
}

// ta funkcja jest wolana z przyciskow w tabeli (przez onclick)
export function edytujProdukt(id: number): void {
    const produkty = wczytajProdukty();
    const produkt = produkty.find(p => p.id === id);
    if (!produkt) return;

    edytowanyId = id;
    const formularz = document.getElementById("formularz-kontener");
    const tytul = document.getElementById("formularz-tytul");
    if (!formularz || !tytul) return;

    tytul.textContent = "Edytuj produkt";
    wypelnijFormularz(produkt);
    formularz.style.display = "block";

    // przewijam do formularza
    formularz.scrollIntoView({ behavior: "smooth" });
}

// usuwa produkt po potwierdzeniu
export function usunProduktUI(id: number): void {
    const czy = confirm("Czy na pewno chcesz usunąć ten produkt?");
    if (!czy) return;
    usunProdukt(id);
    renderujListe();
}

// zapisuje dane z formularza
export function zapiszFormularz(): void {
    const ean = (document.getElementById("pole-ean") as HTMLInputElement).value.trim();
    const nazwa = (document.getElementById("pole-nazwa") as HTMLInputElement).value.trim();
    const kategoria = (document.getElementById("pole-kategoria") as HTMLSelectElement).value as Kategoria;
    const miejsce = (document.getElementById("pole-miejsce") as HTMLInputElement).value.trim();
    const iloscStr = (document.getElementById("pole-ilosc") as HTMLInputElement).value;
    const cenaStr = (document.getElementById("pole-cena") as HTMLInputElement).value;

    // walidacja - sprawdzam czy wszystko jest wypelnione
    if (!ean || !nazwa || !kategoria || !miejsce || !iloscStr || !cenaStr) {
        alert("Wypełnij wszystkie pola!");
        return;
    }

    const ilosc = parseInt(iloscStr);
    const cena = parseFloat(cenaStr);

    if (isNaN(ilosc) || ilosc < 0) {
        alert("Ilość musi być liczbą nieujemną!");
        return;
    }
    if (isNaN(cena) || cena < 0) {
        alert("Cena musi być poprawną liczbą!");
        return;
    }

    if (edytowanyId === null) {
        // dodajemy nowy
        dodajProdukt({ ean, nazwa, kategoria, miejsce, ilosc, cena });
    } else {
        // aktualizujemy istniejacy
        aktualizujProdukt({ id: edytowanyId, ean, nazwa, kategoria, miejsce, ilosc, cena });
        edytowanyId = null;
    }

    ukryjFormularz();
    renderujListe();
}

// chowa formularz
export function ukryjFormularz(): void {
    const formularz = document.getElementById("formularz-kontener");
    if (!formularz) return;
    formularz.style.display = "none";
}
