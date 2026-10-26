// tutaj zapisuje i wczytuje produkty z localStorage

import { Produkt } from "./types";

const KLUCZ = "elektrobud_produkty";

// wczytuje liste produktow z pamieci
export function wczytajProdukty(): Produkt[] {
    const dane = localStorage.getItem(KLUCZ);
    if (dane === null) {
        return [];
    }
    return JSON.parse(dane) as Produkt[];
}

// zapisuje cala liste do pamieci
export function zapiszProdukty(produkty: Produkt[]): void {
    localStorage.setItem(KLUCZ, JSON.stringify(produkty));
}

// dodaje nowy produkt, id robie jako timestamp zeby bylo unikalne
export function dodajProdukt(produkt: Omit<Produkt, "id">): void {
    const lista = wczytajProdukty();
    const nowyProdukt: Produkt = {
        ...produkt,
        id: Date.now()
    };
    lista.push(nowyProdukt);
    zapiszProdukty(lista);
}

// aktualizuje produkt po id
export function aktualizujProdukt(zaktualizowany: Produkt): void {
    const lista = wczytajProdukty();
    const index = lista.findIndex(p => p.id === zaktualizowany.id);
    if (index !== -1) {
        lista[index] = zaktualizowany;
        zapiszProdukty(lista);
    }
}

// usuwa produkt po id
export function usunProdukt(id: number): void {
    const lista = wczytajProdukty();
    const nowaLista = lista.filter(p => p.id !== id);
    zapiszProdukty(nowaLista);
}
