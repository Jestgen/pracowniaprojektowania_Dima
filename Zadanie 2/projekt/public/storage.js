// tutaj zapisuje i wczytuje produkty z localStorage
const KLUCZ = "elektrobud_produkty";
// wczytuje liste produktow z pamieci
export function wczytajProdukty() {
    const dane = localStorage.getItem(KLUCZ);
    if (dane === null) {
        return [];
    }
    return JSON.parse(dane);
}
// zapisuje cala liste do pamieci
export function zapiszProdukty(produkty) {
    localStorage.setItem(KLUCZ, JSON.stringify(produkty));
}
// dodaje nowy produkt, id robie jako timestamp zeby bylo unikalne
export function dodajProdukt(produkt) {
    const lista = wczytajProdukty();
    const nowyProdukt = {
        ...produkt,
        id: Date.now()
    };
    lista.push(nowyProdukt);
    zapiszProdukty(lista);
}
// aktualizuje produkt po id
export function aktualizujProdukt(zaktualizowany) {
    const lista = wczytajProdukty();
    const index = lista.findIndex(p => p.id === zaktualizowany.id);
    if (index !== -1) {
        lista[index] = zaktualizowany;
        zapiszProdukty(lista);
    }
}
// usuwa produkt po id
export function usunProdukt(id) {
    const lista = wczytajProdukty();
    const nowaLista = lista.filter(p => p.id !== id);
    zapiszProdukty(nowaLista);
}
