/*
 * Projekt: Elektro-Bud - system magazynowy (fragment)
 * Autor: Dmytro Ziabliuk
 * 
 * Zakres funkcjonalny:
 * - Wyświetlanie listy produktów z magazynu
 * - Dodawanie nowego produktu (EAN, nazwa, kategoria, miejsce, ilość, cena)
 * - Edycja istniejącego produktu
 * - Usuwanie produktu
 * - Wyszukiwanie produktu po nazwie, EAN lub kategorii
 * 
 * Dane są przechowywane w localStorage przeglądarki.
 * Aplikacja dotyczy fragmentu systemu opisanego w analizie wymagań -
 * konkretnie zarządzania bazą towarów (bez części o przyjęciach/wydaniach).
 */

import {
    renderujListe,
    pokazFormularzDodawania,
    edytujProdukt,
    usunProduktUI,
    zapiszFormularz,
    ukryjFormularz
} from "./ui";

import { dodajProdukt } from "./storage";
import { wczytajProdukty } from "./storage";

// funkcja startowa - odpala sie jak strona sie zaladuje
function start(): void {
    // dodaje przykladowe produkty jesli magazyn jest pusty
    const produkty = wczytajProdukty();
    if (produkty.length === 0) {
        dodajDanePrzykladowe();
    }

    renderujListe();
    podepnijPrzyciski();
}

// dodaje kilka przykladowych produktow zeby nie bylo pusto na start
function dodajDanePrzykladowe(): void {
    dodajProdukt({ ean: "5901234123457", nazwa: "Kabel NYM-J 3x1.5mm", kategoria: "kable", miejsce: "S1-R1-P1", ilosc: 50, cena: 4.99 });
    dodajProdukt({ ean: "5901234123458", nazwa: "Gniazdko podtynkowe białe", kategoria: "gniazdka", miejsce: "S1-R2-P1", ilosc: 120, cena: 8.50 });
    dodajProdukt({ ean: "5901234123459", nazwa: "Bezpiecznik B16 10szt", kategoria: "bezpieczniki", miejsce: "S2-R1-P3", ilosc: 2, cena: 22.00 });
    dodajProdukt({ ean: "5901234123460", nazwa: "Przedluzacz 5m 3 gniazda", kategoria: "inne", miejsce: "S2-R3-P2", ilosc: 15, cena: 35.90 });
    dodajProdukt({ ean: "5901234123461", nazwa: "Wkretarka akumulatorowa 18V", kategoria: "narzedzia", miejsce: "S3-R1-P1", ilosc: 3, cena: 299.00 });
}

// podpina eventy do przyciskow
function podepnijPrzyciski(): void {
    // przycisk dodawania
    const btnDodaj = document.getElementById("btn-dodaj");
    if (btnDodaj) {
        btnDodaj.addEventListener("click", () => {
            pokazFormularzDodawania();
        });
    }

    // przycisk zapisz w formularzu
    const btnZapisz = document.getElementById("btn-zapisz");
    if (btnZapisz) {
        btnZapisz.addEventListener("click", () => {
            zapiszFormularz();
        });
    }

    // przycisk anuluj
    const btnAnuluj = document.getElementById("btn-anuluj");
    if (btnAnuluj) {
        btnAnuluj.addEventListener("click", () => {
            ukryjFormularz();
        });
    }

    // wyszukiwarka
    const szukajka = document.getElementById("wyszukaj") as HTMLInputElement | null;
    if (szukajka) {
        szukajka.addEventListener("input", () => {
            renderujListe(szukajka.value);
        });
    }
}

// eksportuje funkcje do window zeby dzialaly onclick w tabeli
// troche brzydkie ale dziala
(window as Window & typeof globalThis & {
    edytuj: (id: number) => void;
    usun: (id: number) => void;
}).edytuj = edytujProdukt;

(window as Window & typeof globalThis & {
    edytuj: (id: number) => void;
    usun: (id: number) => void;
}).usun = usunProduktUI;

// startuje aplikacje
document.addEventListener("DOMContentLoaded", start);
