# TypeScript – materiały dodatkowe (uzupełnienie do notatek)

Ten plik uzupełnia `praca-klasowa-notatki.md`. Tu są rzeczy, których tam nie ma: rozszerzona aplikacja Todo, więcej Bootstrapa, zaawansowane typy, zaawansowane klasy, więcej o modułach i `tsconfig`, narzędzia i debugowanie.

---

## Spis treści

1. Todo – wersja rozszerzona (localStorage, filtrowanie, edycja, licznik)
2. Bootstrap – dodatkowe komponenty
3. Typy – zaawansowane
4. Klasy – zaawansowane
5. Moduły – zaawansowane
6. `tsconfig.json` – dodatkowe opcje i tryby
7. DOM i zdarzenia w TypeScript
8. Asynchroniczność i `fetch`
9. Narzędzia: npm, Vite, ts-node, ESLint
10. Debugowanie i typowe komunikaty błędów
11. Zadania praktyczne na sprawdzian
12. Mini-słownik pojęć

---

## 1. Todo – wersja rozszerzona

### 1.1 Zapis w `localStorage`

```ts
// src/storage.ts
import { TodoItem } from "./Todo.js";

const KEY = "todos";

export function saveTodos(items: readonly TodoItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function loadTodos(): TodoItem[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as TodoItem[];
  } catch {
    return [];
  }
}
```

- `localStorage` przechowuje tylko **stringi**, stąd `JSON.stringify` / `JSON.parse`.
- `getItem` zwraca `string | null`, więc trzeba sprawdzić `null`.
- `JSON.parse` zwraca `any`, dlatego rzutujemy (`as`) lub walidujemy dane (patrz type guards).

### 1.2 Klasa z zapisem, edycją i filtrowaniem

```ts
// src/TodoList.ts
import { TodoItem, TodoStatus } from "./Todo.js";
import { loadTodos, saveTodos } from "./storage.js";

export type Filter = "all" | TodoStatus;

export class TodoList {
  private items: TodoItem[];
  private nextId: number;

  constructor() {
    this.items = loadTodos();
    this.nextId = this.items.reduce((max, i) => Math.max(max, i.id), 0) + 1;
  }

  add(title: string): TodoItem {
    const item: TodoItem = { id: this.nextId++, title, status: "active" };
    this.items.push(item);
    this.persist();
    return item;
  }

  edit(id: number, title: string): void {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.title = title;
      this.persist();
    }
  }

  remove(id: number): void {
    this.items = this.items.filter(i => i.id !== id);
    this.persist();
  }

  toggle(id: number): void {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.status = item.status === "active" ? "done" : "active";
      this.persist();
    }
  }

  clearDone(): void {
    this.items = this.items.filter(i => i.status !== "done");
    this.persist();
  }

  get(filter: Filter = "all"): readonly TodoItem[] {
    return filter === "all"
      ? this.items
      : this.items.filter(i => i.status === filter);
  }

  get remaining(): number {
    return this.items.filter(i => i.status === "active").length;
  }

  private persist(): void {
    saveTodos(this.items);
  }
}
```

### 1.3 Interfejs z filtrami i licznikiem (Bootstrap)

```html
<div class="btn-group mb-3" role="group" aria-label="Filtry">
  <button type="button" class="btn btn-outline-primary active" data-filter="all">Wszystkie</button>
  <button type="button" class="btn btn-outline-primary" data-filter="active">Aktywne</button>
  <button type="button" class="btn btn-outline-primary" data-filter="done">Zrobione</button>
</div>

<p class="text-muted"><span id="counter">0</span> zadań do zrobienia</p>
<button id="clear-done" class="btn btn-sm btn-outline-danger">Usuń zrobione</button>
```

```ts
// src/main.ts (fragment)
import { TodoList, Filter } from "./TodoList.js";

let currentFilter: Filter = "all";

document.querySelectorAll<HTMLButtonElement>("[data-filter]").forEach(btn => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter as Filter;
    document.querySelectorAll("[data-filter]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    render();
  });
});

function renderCounter(): void {
  const el = document.getElementById("counter");
  if (el) el.textContent = String(list.remaining);
}
```

- `querySelectorAll<HTMLButtonElement>` – generyk określa typ elementów.
- `dataset.filter` odpowiada atrybutowi `data-filter` w HTML.

### 1.4 Delegacja zdarzeń (jeden listener na całą listę)

```ts
ul.addEventListener("click", (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  const li = target.closest("li");
  if (!li) return;
  const id = Number(li.dataset.id);

  if (target.matches(".btn-delete")) {
    list.remove(id);
  } else if (target.matches(".todo-title")) {
    list.toggle(id);
  }
  render();
});
```

Zaleta: nie trzeba podpinać listenerów do każdego elementu osobno po każdym `render()`.

### 1.5 Bezpieczne wstawianie tekstu (XSS)

- `textContent` – wstawia tekst, **bezpieczne**.
- `innerHTML` – interpretuje HTML, **niebezpieczne** dla danych od użytkownika.
- Jeśli budujesz HTML ze stringa, zawsze escapuj dane użytkownika.

```ts
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
```

### 1.6 Walidacja formularza (Bootstrap)

```html
<input id="todo-input" class="form-control" required minlength="3">
<div class="invalid-feedback">Wpisz co najmniej 3 znaki.</div>
```

```ts
form.addEventListener("submit", e => {
  e.preventDefault();
  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    return;
  }
  // ...dodaj zadanie
});
```

---

## 2. Bootstrap – dodatkowe komponenty

### 2.1 Navbar

```html
<nav class="navbar navbar-expand-lg bg-body-tertiary">
  <div class="container-fluid">
    <a class="navbar-brand" href="#">Todo</a>
    <button class="navbar-toggler" type="button"
            data-bs-toggle="collapse" data-bs-target="#menu">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="menu">
      <ul class="navbar-nav ms-auto">
        <li class="nav-item"><a class="nav-link active" href="#">Start</a></li>
        <li class="nav-item"><a class="nav-link" href="#">O nas</a></li>
      </ul>
    </div>
  </div>
</nav>
```

### 2.2 Card

```html
<div class="card" style="width: 18rem;">
  <img src="obraz.jpg" class="card-img-top" alt="opis">
  <div class="card-body">
    <h5 class="card-title">Tytuł</h5>
    <p class="card-text">Treść karty.</p>
    <a href="#" class="btn btn-primary">Przycisk</a>
  </div>
</div>
```

### 2.3 Alert

```html
<div class="alert alert-success" role="alert">Zadanie dodane!</div>
<div class="alert alert-danger alert-dismissible fade show" role="alert">
  Błąd!
  <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
</div>
```

Kolory kontekstowe: `primary`, `secondary`, `success`, `danger`, `warning`, `info`, `light`, `dark`.

### 2.4 Modal (okno dialogowe)

```html
<button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#myModal">Otwórz</button>

<div class="modal fade" id="myModal" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Edycja zadania</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <input id="edit-input" class="form-control">
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-bs-dismiss="modal">Anuluj</button>
        <button class="btn btn-primary" id="save-edit">Zapisz</button>
      </div>
    </div>
  </div>
</div>
```

Sterowanie modalem z kodu (wymaga `bootstrap.bundle.js`):

```ts
declare const bootstrap: any;   // proste rozwiązanie bez @types/bootstrap

const modalEl = document.getElementById("myModal")!;
const modal = new bootstrap.Modal(modalEl);
modal.show();
modal.hide();
```

Lepiej: `npm i -D @types/bootstrap`, wtedy `import { Modal } from "bootstrap";`.

### 2.5 Tabele

```html
<table class="table table-striped table-hover table-bordered">
  <thead class="table-dark">
    <tr><th>#</th><th>Zadanie</th><th>Status</th></tr>
  </thead>
  <tbody>
    <tr><td>1</td><td>Nauka TS</td><td><span class="badge text-bg-success">Zrobione</span></td></tr>
  </tbody>
</table>
```

### 2.6 Formularze – więcej

```html
<div class="mb-3">
  <label for="email" class="form-label">Email</label>
  <input type="email" class="form-control" id="email">
</div>

<select class="form-select">
  <option selected>Wybierz</option>
  <option value="1">Opcja 1</option>
</select>

<div class="form-check form-switch">
  <input class="form-check-input" type="checkbox" id="sw">
  <label class="form-check-label" for="sw">Przełącznik</label>
</div>
```

### 2.7 Pozostałe klasy użytkowe (utilities)

| Kategoria | Klasy |
|---|---|
| Kolory tła | `bg-primary`, `bg-light`, `bg-dark`, `bg-success` |
| Kolory tekstu | `text-primary`, `text-white`, `text-danger` |
| Obramowania | `border`, `border-0`, `border-primary`, `rounded`, `rounded-pill`, `rounded-circle` |
| Cienie | `shadow`, `shadow-sm`, `shadow-lg` |
| Rozmiary | `w-25`, `w-50`, `w-100`, `h-100`, `vh-100` |
| Pozycja | `position-relative`, `position-absolute`, `fixed-top`, `sticky-top` |
| Flex | `flex-column`, `flex-wrap`, `gap-2`, `justify-content-center`, `align-self-end` |
| Tekst | `text-start`, `text-end`, `fs-1`…`fs-6`, `fw-light`, `text-uppercase`, `text-truncate` |
| Widoczność | `visible`, `invisible`, `d-none d-md-block` |

### 2.8 Ciemny motyw (Bootstrap 5.3)

```html
<html lang="pl" data-bs-theme="dark">
```

Przełączanie w TS:

```ts
document.documentElement.setAttribute("data-bs-theme", "light");
```

### 2.9 Bootstrap przez npm (zamiast CDN)

```bash
npm install bootstrap
npm install -D @types/bootstrap
```

```ts
import "bootstrap/dist/css/bootstrap.min.css";   // wymaga bundlera (np. Vite)
import * as bootstrap from "bootstrap";
```

---

## 3. Typy – zaawansowane

### 3.1 Enum

```ts
enum Direction { Up, Down, Left, Right }        // 0,1,2,3
enum Status { Active = "ACTIVE", Done = "DONE" } // string enum

const d: Direction = Direction.Up;
const s: Status = Status.Done;
```

- `const enum` – wstawiany inline, znika po kompilacji.
- Alternatywa często używana dziś: **union literałów** (`type Status = "active" | "done"`) – lżejsza, bez kodu w JS.

### 3.2 Union, intersection, literały

```ts
type Id = number | string;
type Mode = "light" | "dark";
type Dir = 1 | -1;

type A = { a: number };
type B = { b: string };
type AB = A & B;          // musi mieć a i b
```

### 3.3 Discriminated union (unia z dyskryminatorem)

```ts
type Circle = { kind: "circle"; radius: number };
type Square = { kind: "square"; side: number };
type Shape = Circle | Square;

function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.radius ** 2;
    case "square": return s.side ** 2;
  }
}
```

Pole `kind` pozwala TypeScriptowi zawęzić typ w każdej gałęzi.

### 3.4 Type guards (strażnicy typów)

```ts
function isString(x: unknown): x is string {
  return typeof x === "string";
}

function isTodo(x: any): x is TodoItem {
  return typeof x?.id === "number"
      && typeof x?.title === "string"
      && (x.status === "active" || x.status === "done");
}
```

Inne sposoby zawężania: `typeof`, `instanceof`, `in`, porównanie z `null`, `Array.isArray`.

```ts
if (x instanceof HTMLInputElement) { x.value; }
if ("name" in obj) { obj.name; }
```

### 3.5 Utility types (typy pomocnicze)

```ts
interface User { id: number; name: string; email: string; }

Partial<User>              // wszystkie pola opcjonalne
Required<User>             // wszystkie wymagane
Readonly<User>             // wszystkie readonly
Pick<User, "id" | "name">  // tylko wybrane pola
Omit<User, "email">        // wszystko oprócz wskazanych
Record<string, number>     // obiekt: klucz string → wartość number
Exclude<"a" | "b" | "c", "a">   // "b" | "c"
Extract<"a" | "b", "a">         // "a"
NonNullable<string | null>      // string
ReturnType<typeof fn>           // typ zwracany przez funkcję
Parameters<typeof fn>           // krotka typów parametrów
Awaited<Promise<string>>        // string
```

### 3.6 `keyof`, `typeof`, indeksowane typy

```ts
const config = { host: "localhost", port: 3000 };

type Config = typeof config;        // { host: string; port: number }
type Key = keyof Config;            // "host" | "port"
type Port = Config["port"];         // number

function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

### 3.7 Mapped types

```ts
type Optional<T> = { [K in keyof T]?: T[K] };
type ReadonlyAll<T> = { readonly [K in keyof T]: T[K] };
```

### 3.8 Conditional types

```ts
type IsString<T> = T extends string ? "tak" : "nie";
type A = IsString<string>;   // "tak"
type B = IsString<number>;   // "nie"
```

### 3.9 Generyki – więcej

```ts
function identity<T>(x: T): T { return x; }

interface Repo<T extends { id: number }> {
  getAll(): T[];
  getById(id: number): T | undefined;
  add(item: T): void;
}

class Stack<T> {
  private items: T[] = [];
  push(x: T): void { this.items.push(x); }
  pop(): T | undefined { return this.items.pop(); }
}

const s = new Stack<number>();
```

- `T extends X` – ograniczenie generyka.
- Wartości domyślne: `<T = string>`.

### 3.10 `any`, `unknown`, `never`, `void`

| Typ | Opis |
|---|---|
| `any` | wyłącza sprawdzanie typów (unikać) |
| `unknown` | jak `any`, ale przed użyciem trzeba zawęzić typ |
| `never` | wartość, która nigdy nie wystąpi (funkcja rzucająca błąd, wyczerpany `switch`) |
| `void` | brak zwracanej wartości |
| `null`, `undefined` | osobne typy, przy `strictNullChecks` nie wchodzą w inne |

### 3.11 Asercje i operatory

```ts
const el = document.getElementById("x") as HTMLInputElement;  // asercja
const el2 = document.getElementById("x")!;                    // non-null assertion
const val = obj?.prop?.nested;                                // optional chaining
const name = user.name ?? "Anonim";                           // nullish coalescing
const cfg = { a: 1 } as const;                                // readonly literały
const x = value satisfies SomeType;                           // sprawdza typ bez zawężania
```

Asercje **nie zmieniają** kodu w runtime – tylko mówią kompilatorowi „ufaj mi”.

### 3.12 Opcjonalne parametry, `rest`, przeciążenia

```ts
function f(a: number, b?: number, c = 10): number { return a + (b ?? 0) + c; }
function sum(...nums: number[]): number { return nums.reduce((a, b) => a + b, 0); }

function parse(x: string): number;
function parse(x: number): string;
function parse(x: string | number): number | string {
  return typeof x === "string" ? Number(x) : String(x);
}
```

### 3.13 Typy funkcji i `this`

```ts
type Handler = (e: Event) => void;
type Op = (a: number, b: number) => number;

interface Calc { (a: number, b: number): number; }
```

### 3.14 Krotki (tuples) – więcej

```ts
type Pair = [string, number];
type Named = [name: string, age: number];
type Opt = [string, number?];
type Rest = [string, ...number[]];
```

### 3.15 Indeksowanie obiektów

```ts
interface Dict { [key: string]: number; }
const d: Dict = { a: 1, b: 2 };

const map = new Map<string, number>();
map.set("a", 1);

const set = new Set<number>([1, 2, 3]);
```

### 3.16 Template literal types

```ts
type Event = `on${Capitalize<"click" | "hover">}`;   // "onClick" | "onHover"
```

---

## 4. Klasy – zaawansowane

### 4.1 Gettery, settery, static, readonly – razem

```ts
class Account {
  static bank = "PKO";
  private _balance = 0;
  readonly id: number;

  constructor(id: number) { this.id = id; }

  get balance(): number { return this._balance; }

  deposit(amount: number): this {
    if (amount <= 0) throw new Error("Kwota musi być dodatnia");
    this._balance += amount;
    return this;                       // method chaining
  }
}

new Account(1).deposit(100).deposit(50);
```

### 4.2 Static block i metody statyczne

```ts
class Config {
  static readonly values = new Map<string, string>();
  static {
    Config.values.set("env", "dev");
  }
  static get(key: string) { return Config.values.get(key); }
}
```

### 4.3 Singleton

```ts
class Logger {
  private static instance: Logger;
  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) Logger.instance = new Logger();
    return Logger.instance;
  }
  log(msg: string) { console.log(msg); }
}

Logger.getInstance().log("hej");
```

### 4.4 Klasa a interfejs – implementacja wielu

```ts
interface Serializable { serialize(): string; }
interface Comparable<T> { compareTo(other: T): number; }

class Point implements Serializable, Comparable<Point> {
  constructor(public x: number, public y: number) {}
  serialize() { return JSON.stringify(this); }
  compareTo(o: Point) { return this.x - o.x; }
}
```

### 4.5 Klasa abstrakcyjna z konstruktorem

```ts
abstract class Animal {
  constructor(protected name: string) {}
  abstract sound(): string;
  speak() { return `${this.name}: ${this.sound()}`; }
}

class Dog extends Animal {
  sound() { return "Hau"; }
}
```

- Nie można utworzyć instancji klasy abstrakcyjnej (`new Animal()` → błąd).

### 4.6 `this` w metodach i funkcje strzałkowe

```ts
class Btn {
  label = "OK";

  // problem: this zgubione po przekazaniu jako callback
  handleBad() { console.log(this.label); }

  // rozwiązanie: arrow function jako pole klasy
  handleGood = () => { console.log(this.label); };
}

const b = new Btn();
button.addEventListener("click", b.handleGood);          // działa
button.addEventListener("click", b.handleBad.bind(b));   // też działa
```

### 4.7 Mixiny (wzorzec)

```ts
type Constructor<T = {}> = new (...args: any[]) => T;

function Timestamped<TBase extends Constructor>(Base: TBase) {
  return class extends Base { createdAt = new Date(); };
}
```

### 4.8 Dekoratory (zaawansowane, eksperymentalne)

```json
{ "compilerOptions": { "experimentalDecorators": true } }
```

```ts
function Log(target: any, key: string, desc: PropertyDescriptor) {
  const original = desc.value;
  desc.value = function (...args: any[]) {
    console.log(`Wywołanie ${key}`, args);
    return original.apply(this, args);
  };
}

class Service {
  @Log
  run(x: number) { return x * 2; }
}
```

### 4.9 Porównanie: `private` vs `#`

| | `private` | `#pole` |
|---|---|---|
| Sprawdzane | tylko przy kompilacji | także w runtime |
| Dostęp przez `obj["pole"]` | możliwy | niemożliwy |
| Widoczne w JS | tak, jako zwykłe pole | nie |

### 4.10 Kompozycja zamiast dziedziczenia

```ts
class Engine { start() { console.log("brum"); } }

class Car {
  constructor(private engine: Engine) {}
  drive() { this.engine.start(); }
}
```

Zasada: „ma” (has-a) → kompozycja, „jest” (is-a) → dziedziczenie.

---

## 5. Moduły – zaawansowane

### 5.1 Barrel file (`index.ts`)

```ts
// src/models/index.ts
export * from "./Todo.js";
export * from "./User.js";
export { default as Product } from "./Product.js";
```

```ts
import { TodoItem, User } from "./models/index.js";
```

### 5.2 Dynamiczny import (lazy loading)

```ts
button.addEventListener("click", async () => {
  const { heavyFunction } = await import("./heavy.js");
  heavyFunction();
});
```

### 5.3 `import type` / `export type`

```ts
import type { TodoItem } from "./Todo.js";   // znika po kompilacji
export type { TodoItem };
```

Opcja `verbatimModuleSyntax` / `importsNotUsedAsValues` wymusza stosowanie tej składni.

### 5.4 Moduł vs skrypt

- Plik z `import` lub `export` na najwyższym poziomie = **moduł** (własny zakres).
- Plik bez nich = **skrypt** (zmienne globalne, mogą się kolidować).
- Żeby wymusić moduł w pliku bez importów: `export {};`

### 5.5 `module` i `moduleResolution` w `tsconfig`

| `module` | Wynik |
|---|---|
| `ES2020` / `ESNext` | `import` / `export` zostają w JS (przeglądarka, bundlery) |
| `commonjs` | `require()` / `module.exports` (klasyczny Node) |
| `NodeNext` | Node z obsługą ESM i CJS |

| `moduleResolution` | Opis |
|---|---|
| `node` / `node10` | klasyczne Node (bez rozszerzeń w ścieżkach) |
| `bundler` | dla Vite/webpack – rozszerzenia opcjonalne |
| `nodenext` | ścisłe ESM, **rozszerzenia `.js` wymagane** |

### 5.6 CommonJS vs ES Modules

```js
// CommonJS
const fs = require("fs");
module.exports = { add };

// ES Modules
import fs from "fs";
export { add };
```

### 5.7 Aliasy ścieżek

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@models/*": ["src/models/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

```ts
import { TodoItem } from "@models/Todo";
```

Uwaga: `tsc` **nie** przepisuje aliasów w wynikowym JS – potrzebny bundler (Vite, webpack) lub osobne narzędzie.

### 5.7 Przestrzenie nazw (namespaces) – dawny sposób

```ts
namespace Utils {
  export function double(x: number) { return x * 2; }
}
Utils.double(2);
```

Dziś zamiast `namespace` używa się modułów ES.

### 5.8 Cykliczne zależności

Gdy A importuje B, a B importuje A, mogą wystąpić błędy typu `undefined` w runtime. Rozwiązanie: wydzielić wspólny kod do trzeciego modułu.

---

## 6. `tsconfig.json` – dodatkowe opcje

### 6.1 Pełna konfiguracja „na wszystko”

```json
{
  "compilerOptions": {
    /* Cel i moduły */
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],

    /* Katalogi */
    "rootDir": "./src",
    "outDir": "./dist",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },

    /* Ścisłość */
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,

    /* Wyjście */
    "sourceMap": true,
    "declaration": false,
    "removeComments": false,
    "noEmitOnError": true,

    /* Kompatybilność */
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 6.2 Opcje wchodzące w skład `strict`

| Opcja | Co robi |
|---|---|
| `noImplicitAny` | błąd, gdy typ wychodzi jako domyślne `any` |
| `strictNullChecks` | `null` i `undefined` to osobne typy |
| `strictFunctionTypes` | ścisłe sprawdzanie typów parametrów funkcji |
| `strictBindCallApply` | sprawdzanie `bind`, `call`, `apply` |
| `strictPropertyInitialization` | pola klasy muszą być zainicjalizowane |
| `noImplicitThis` | błąd przy nieokreślonym `this` |
| `alwaysStrict` | dodaje `"use strict"` |
| `useUnknownInCatchVariables` | zmienna w `catch` ma typ `unknown` |

### 6.3 Pozostałe przydatne opcje

| Opcja | Znaczenie |
|---|---|
| `allowJs` | pozwala kompilować pliki `.js` |
| `checkJs` | sprawdza typy w plikach JS |
| `jsx` | obsługa JSX (`react`, `preserve`) |
| `incremental` | szybsza rekompilacja (cache w `.tsbuildinfo`) |
| `composite` | wspiera projekty wielopakietowe |
| `noEmit` | tylko sprawdza typy, nic nie generuje (przy Vite) |
| `types` | które paczki `@types/*` załadować |
| `typeRoots` | gdzie szukać paczek z typami |
| `experimentalDecorators` | włącza dekoratory |
| `downlevelIteration` | poprawna iteracja dla starszych `target` |
| `importHelpers` | używa `tslib` zamiast powielania helperów |

### 6.4 `extends` – dziedziczenie konfiguracji

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": { "outDir": "./dist" }
}
```

### 6.5 Kilka konfiguracji

```
tsconfig.json           # główna / dla edytora
tsconfig.build.json     # do produkcji (bez testów)
```

```bash
npx tsc -p tsconfig.build.json
```

### 6.6 Komendy `tsc`

```bash
npx tsc                       # kompilacja wg tsconfig
npx tsc --watch               # tryb obserwacji
npx tsc --noEmit              # tylko sprawdzenie typów
npx tsc plik.ts               # pojedynczy plik (ignoruje tsconfig!)
npx tsc --init                # utworzenie tsconfig.json
npx tsc --showConfig          # pokaż wynikową konfigurację
npx tsc --version
```

Ważne: `tsc plik.ts` **ignoruje** `tsconfig.json`.

### 6.7 Pliki deklaracji `.d.ts`

```ts
// globals.d.ts
declare const VERSION: string;

declare module "*.png" {
  const src: string;
  export default src;
}

declare global {
  interface Window { myApp: { version: string } }
}
export {};
```

- `.d.ts` zawierają **tylko typy**, nie kod.
- Typy do bibliotek JS: `npm i -D @types/nazwa`.

---

## 7. DOM i zdarzenia w TypeScript

### 7.1 Hierarchia typów

```
EventTarget → Node → Element → HTMLElement → HTMLInputElement, HTMLButtonElement, ...
```

### 7.2 Wybieranie elementów

```ts
document.getElementById("id");                       // HTMLElement | null
document.querySelector(".klasa");                    // Element | null
document.querySelector<HTMLInputElement>("#in");     // HTMLInputElement | null
document.querySelectorAll("li");                     // NodeListOf<Element>
document.getElementsByClassName("x");                // HTMLCollectionOf<Element>
document.createElement("div");                       // HTMLDivElement
```

### 7.3 Typy elementów i właściwości

| Typ | Przykładowe właściwości |
|---|---|
| `HTMLInputElement` | `value`, `checked`, `type`, `disabled`, `files` |
| `HTMLSelectElement` | `value`, `selectedIndex`, `options` |
| `HTMLTextAreaElement` | `value` |
| `HTMLFormElement` | `elements`, `submit()`, `reset()`, `checkValidity()` |
| `HTMLButtonElement` | `disabled`, `type` |
| `HTMLAnchorElement` | `href`, `target` |
| `HTMLImageElement` | `src`, `alt` |

### 7.4 Manipulacja elementami

```ts
el.textContent = "tekst";
el.innerHTML = "<b>pogrubione</b>";
el.setAttribute("data-id", "5");
el.getAttribute("data-id");
el.removeAttribute("disabled");
el.dataset.id = "5";
el.classList.add("a", "b");
el.classList.remove("a");
el.classList.toggle("active");
el.classList.contains("active");
el.style.color = "red";

parent.appendChild(child);
parent.append(a, b, "tekst");
parent.prepend(el);
el.remove();
el.replaceWith(inny);
el.insertAdjacentHTML("beforeend", "<li>x</li>");
```

### 7.5 Zdarzenia – typy

```ts
button.addEventListener("click", (e: MouseEvent) => {});
input.addEventListener("input", (e: Event) => {
  const value = (e.target as HTMLInputElement).value;
});
input.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key === "Enter") { /* ... */ }
});
form.addEventListener("submit", (e: SubmitEvent) => e.preventDefault());
select.addEventListener("change", () => console.log(select.value));
window.addEventListener("DOMContentLoaded", () => {});
```

| Zdarzenie | Typ |
|---|---|
| `click`, `dblclick`, `mouseover` | `MouseEvent` |
| `keydown`, `keyup` | `KeyboardEvent` |
| `submit` | `SubmitEvent` |
| `input`, `change` | `Event` / `InputEvent` |
| `focus`, `blur` | `FocusEvent` |

### 7.6 `e.target` vs `e.currentTarget`

- `target` – element, w który faktycznie kliknięto (może być wewnętrzny).
- `currentTarget` – element, do którego **podpięto** listener.

### 7.7 `defer` i `DOMContentLoaded`

`<script type="module">` jest automatycznie odroczony (`defer`), więc DOM jest gotowy. Przy zwykłym `<script>` w `<head>` bez `defer` elementy mogą jeszcze nie istnieć (`null`).

---

## 8. Asynchroniczność i `fetch`

### 8.1 Promise i `async/await`

```ts
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run(): Promise<void> {
  await wait(1000);
  console.log("po sekundzie");
}
```

### 8.2 Pobieranie danych z API

```ts
interface Post { id: number; title: string; body: string; userId: number; }

async function getPosts(): Promise<Post[]> {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Post[];
}

async function addPost(post: Omit<Post, "id">): Promise<Post> {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post),
  });
  return res.json();
}
```

### 8.3 Obsługa błędów

```ts
try {
  const posts = await getPosts();
} catch (err) {
  if (err instanceof Error) console.error(err.message);
} finally {
  console.log("koniec");
}
```

Przy `strict` zmienna w `catch` ma typ `unknown` – trzeba ją zawęzić.

### 8.4 Równoległe wywołania

```ts
const [a, b] = await Promise.all([fetchA(), fetchB()]);
const results = await Promise.allSettled([p1, p2]);
const first = await Promise.race([p1, p2]);
```

### 8.5 Typy dla odpowiedzi

```ts
type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
```

---

## 9. Narzędzia

### 9.1 npm – podstawy

```bash
npm init -y                       # utwórz package.json
npm install nazwa                 # zależność
npm install -D nazwa              # zależność developerska
npm uninstall nazwa
npm run build                     # skrypt z package.json
npm update
npx komenda                       # uruchom lokalnie zainstalowane narzędzie
```

### 9.2 Vite (najprostszy bundler)

```bash
npm create vite@latest todo-app -- --template vanilla-ts
cd todo-app
npm install
npm run dev        # serwer deweloperski z hot reload
npm run build      # produkcja do dist/
```

Vite sam obsługuje TS, moduły i import CSS (`import "bootstrap/dist/css/bootstrap.min.css"`).

### 9.3 ts-node / tsx (uruchamianie TS w Node)

```bash
npm i -D tsx
npx tsx src/index.ts
```

### 9.4 ESLint i Prettier

```bash
npm i -D eslint prettier typescript-eslint
```

- ESLint – wykrywa błędy i złe praktyki.
- Prettier – formatuje kod.

### 9.5 `.gitignore` dla projektu TS

```
node_modules/
dist/
*.tsbuildinfo
.env
.DS_Store
```

### 9.6 Typowy `package.json`

```json
{
  "name": "todo-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "start": "npx serve ."
  },
  "devDependencies": {
    "typescript": "^5.6.0"
  }
}
```

- `"type": "module"` – pliki `.js` w Node traktowane jako ES Modules.

### 9.7 Serwer lokalny dla modułów

```bash
npx serve .          # prosty serwer statyczny
npx http-server .
```

Albo rozszerzenie **Live Server** w VS Code.

---

## 10. Debugowanie i typowe komunikaty błędów

### 10.1 Komunikaty kompilatora TS

| Komunikat | Przyczyna / rozwiązanie |
|---|---|
| `TS2322: Type 'string' is not assignable to type 'number'` | zły typ przypisywanej wartości |
| `TS2339: Property 'x' does not exist on type 'Y'` | brak pola w typie, literówka lub trzeba zawęzić typ |
| `TS2345: Argument of type ... is not assignable to parameter` | zły typ argumentu funkcji |
| `TS2531/TS18047: Object is possibly 'null'` | użyj `?.`, `if (el)` lub `!` |
| `TS7006: Parameter 'x' implicitly has an 'any' type` | dopisz typ parametru |
| `TS2304: Cannot find name 'document'` | brak `"DOM"` w `lib` |
| `TS2307: Cannot find module './x'` | zła ścieżka lub brak rozszerzenia (`nodenext`) |
| `TS2564: Property has no initializer` | zainicjalizuj pole lub użyj `!` / `?` |
| `TS1259 / TS1192` (importy) | problem z `esModuleInterop` / default export |
| `TS2554: Expected 2 arguments, but got 1` | zła liczba argumentów |
| `TS2741: Property is missing in type` | brakuje wymaganego pola w obiekcie |

### 10.2 Błędy w przeglądarce

| Błąd | Przyczyna |
|---|---|
| `Uncaught SyntaxError: Cannot use import statement outside a module` | brak `type="module"` |
| `Failed to load module script: ... MIME type` | serwer nie zwraca `.js` jako JavaScript lub zła ścieżka |
| `CORS policy` przy `file://` | uruchom przez serwer lokalny |
| `Cannot read properties of null` | element nie istnieje (zły `id` lub skrypt ładowany za wcześnie) |
| `404 Not Found` dla `.js` | import bez `.js` lub zła ścieżka do `dist/` |

### 10.3 Debugowanie

- `console.log`, `console.table`, `console.error`, `console.dir`.
- Kluczowe narzędzia: **DevTools → Sources** (breakpointy), **Console**, **Network**, **Application → Local Storage**.
- `"sourceMap": true` pozwala debugować `.ts` bezpośrednio w przeglądarce.
- `debugger;` w kodzie zatrzymuje wykonanie, gdy DevTools są otwarte.

---

## 11. Zadania praktyczne na sprawdzian

### Zadanie 1 – Typy

Zdefiniuj `type Priority = "low" | "medium" | "high"` i rozszerz `TodoItem` o pole `priority` oraz opcjonalne `dueDate?: Date`.

### Zadanie 2 – Klasa

Napisz klasę `Timer` z prywatnym polem `seconds`, metodami `start()`, `stop()`, `reset()` i getterem `elapsed`.

### Zadanie 3 – Dziedziczenie

Napisz klasę abstrakcyjną `Vehicle` z metodą abstrakcyjną `move()` oraz klasy `Car` i `Bike`.

### Zadanie 4 – Moduły

Rozdziel aplikację na pliki: `models.ts`, `storage.ts`, `ui.ts`, `main.ts`. Użyj `export`/`import` oraz `import type`.

### Zadanie 5 – tsconfig

Skonfiguruj `tsconfig.json` tak, aby: kod źródłowy był w `src`, wynik w `dist`, włączony tryb `strict`, wynik w ES2020 z modułami ES, dostępne typy DOM.

### Zadanie 6 – Bootstrap

Zbuduj stronę z navbarem, kontenerem, dwiema kolumnami (`col-md-8` i `col-md-4`), kartą i formularzem z walidacją.

### Zadanie 7 – Todo

Dodaj do aplikacji:
- edycję zadania po dwukliku,
- filtrowanie (wszystkie / aktywne / zrobione),
- zapis w `localStorage`,
- licznik pozostałych zadań,
- przycisk „Usuń zrobione”.

### Zadanie 8 – Generyki

Napisz generyczną klasę `Storage<T>` z metodami `add`, `getAll`, `remove(predicate)`.

### Zadanie 9 – Type guard

Napisz funkcję `isTodoArray(x: unknown): x is TodoItem[]`, która sprawdza dane odczytane z `localStorage`.

### Zadanie 10 – Utility types

Zdefiniuj `type NewTodo = Omit<TodoItem, "id">` oraz `type TodoUpdate = Partial<Omit<TodoItem, "id">>` i napisz funkcję `update(id: number, changes: TodoUpdate)`.

---

## 12. Mini-słownik pojęć

| Pojęcie | Znaczenie |
|---|---|
| **Transpilacja** | zamiana kodu TS na JS |
| **Kompilator `tsc`** | narzędzie TypeScript do sprawdzania typów i generowania JS |
| **Statyczne typowanie** | typy sprawdzane przed uruchomieniem programu |
| **Inferencja typów** | TS sam wnioskuje typ (`let x = 5` → `number`) |
| **Union** | typ będący jednym z kilku (`A \| B`) |
| **Intersection** | typ łączący kilka (`A & B`) |
| **Generyk** | typ parametryzowany (`Array<T>`) |
| **Type guard** | wyrażenie zawężające typ |
| **Asercja typu** | `as Typ`, informacja dla kompilatora |
| **Enkapsulacja** | ukrywanie szczegółów (`private`) |
| **Dziedziczenie** | klasa pochodna rozszerza bazową (`extends`) |
| **Polimorfizm** | różne klasy, ten sam interfejs, inne zachowanie |
| **Abstrakcja** | klasa abstrakcyjna / interfejs definiujące kontrakt |
| **Moduł** | plik z własnym zakresem, `import`/`export` |
| **Bundler** | narzędzie łączące moduły w paczkę (Vite, webpack) |
| **DOM** | obiektowa reprezentacja dokumentu HTML |
| **Hot reload** | automatyczne odświeżanie po zmianie kodu |
| **Source map** | mapowanie JS → TS do debugowania |
| **`.d.ts`** | plik z samymi deklaracjami typów |
| **Strict mode** | `"strict": true`, ścisłe sprawdzanie typów |
| **Grid (Bootstrap)** | 12-kolumnowy system układu strony |
| **Utility classes** | klasy pomocnicze Bootstrapa (`mt-3`, `d-flex`) |
| **Breakpoint** | próg szerokości ekranu (`sm`, `md`, `lg`, `xl`, `xxl`) |
| **CDN** | zewnętrzny serwer z bibliotekami |
| **localStorage** | magazyn klucz-wartość w przeglądarce |

---

## Szybka ściągawka na jednej stronie

```ts
// Typy
let x: number | string;  type T = {...};  interface I {...}
// Funkcja
const f = (a: number, b = 1): number => a + b;
// Klasa
class A extends B implements I { private x = 1; constructor(public y: number) { super(); } }
// Moduł
export const a = 1;  import { a } from "./m.js";  import type { T } from "./t.js";
// DOM
const el = document.querySelector<HTMLInputElement>("#id")!;
el.addEventListener("input", e => (e.target as HTMLInputElement).value);
// tsc
npx tsc --watch
```
