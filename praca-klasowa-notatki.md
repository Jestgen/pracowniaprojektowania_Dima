# Praca klasowa – materiał z pracowni

Powtórka: aplikacja Todo, Bootstrap, `type`, `class`, moduły, `tsconfig`.

---

## 1. Aplikacja Todo (TypeScript + DOM)

### Struktura projektu

```
todo-app/
├── index.html
├── package.json
├── tsconfig.json
├── src/
│   ├── main.ts
│   ├── Todo.ts
│   └── TodoList.ts
└── dist/            # skompilowany JS
```

### Model danych

```ts
// src/Todo.ts
export type TodoStatus = "active" | "done";

export interface TodoItem {
  id: number;
  title: string;
  status: TodoStatus;
}
```

### Klasa zarządzająca listą

```ts
// src/TodoList.ts
import { TodoItem } from "./Todo.js";

export class TodoList {
  private items: TodoItem[] = [];
  private nextId = 1;

  add(title: string): TodoItem {
    const item: TodoItem = { id: this.nextId++, title, status: "active" };
    this.items.push(item);
    return item;
  }

  remove(id: number): void {
    this.items = this.items.filter(i => i.id !== id);
  }

  toggle(id: number): void {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.status = item.status === "active" ? "done" : "active";
    }
  }

  getAll(): readonly TodoItem[] {
    return this.items;
  }
}
```

### Obsługa DOM

```ts
// src/main.ts
import { TodoList } from "./TodoList.js";

const list = new TodoList();
const form = document.getElementById("todo-form") as HTMLFormElement;
const input = document.getElementById("todo-input") as HTMLInputElement;
const ul = document.getElementById("todo-list") as HTMLUListElement;

function render(): void {
  ul.innerHTML = "";
  list.getAll().forEach(item => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";

    const span = document.createElement("span");
    span.textContent = item.title;
    if (item.status === "done") span.classList.add("text-decoration-line-through", "text-muted");
    span.addEventListener("click", () => { list.toggle(item.id); render(); });

    const btn = document.createElement("button");
    btn.className = "btn btn-danger btn-sm";
    btn.textContent = "Usuń";
    btn.addEventListener("click", () => { list.remove(item.id); render(); });

    li.append(span, btn);
    ul.appendChild(li);
  });
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const value = input.value.trim();
  if (!value) return;
  list.add(value);
  input.value = "";
  render();
});
```

### Kluczowe pojęcia

- `document.getElementById` zwraca `HTMLElement | null` – potrzebne rzutowanie (`as`) lub sprawdzenie `null`.
- `e.preventDefault()` – blokuje przeładowanie strony przy wysłaniu formularza.
- `addEventListener` – podpinanie zdarzeń (`click`, `submit`, `input`).
- Po każdej zmianie danych wywołujemy `render()` (przerysowanie listy).

---

## 2. Bootstrap

### Podłączenie (CDN)

```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
```

### Przykładowy `index.html` dla Todo

```html
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Todo</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <h1 class="mb-4">Lista zadań</h1>

        <form id="todo-form" class="input-group mb-3">
          <input id="todo-input" type="text" class="form-control" placeholder="Nowe zadanie">
          <button class="btn btn-primary" type="submit">Dodaj</button>
        </form>

        <ul id="todo-list" class="list-group"></ul>
      </div>
    </div>
  </div>

  <script type="module" src="dist/main.js"></script>
</body>
</html>
```

### Najważniejsze klasy

| Kategoria | Klasy |
|---|---|
| Układ | `container`, `container-fluid`, `row`, `col-md-6`, `col-12` |
| Odstępy | `m-3`, `mt-4`, `mb-2`, `p-3`, `px-2`, `py-1` |
| Flexbox | `d-flex`, `justify-content-between`, `align-items-center` |
| Przyciski | `btn`, `btn-primary`, `btn-danger`, `btn-sm`, `btn-outline-secondary` |
| Formularze | `form-control`, `input-group`, `form-check` |
| Lista | `list-group`, `list-group-item` |
| Tekst | `text-center`, `text-muted`, `fw-bold`, `text-decoration-line-through` |
| Wyświetlanie | `d-none`, `d-block`, `d-md-block` |

### Siatka (grid)

- 12 kolumn w wierszu.
- Breakpointy: `sm` (≥576px), `md` (≥768px), `lg` (≥992px), `xl` (≥1200px).
- Przykład: `col-12 col-md-6 col-lg-4` – 1 kolumna na telefonie, 2 na tablecie, 3 na desktopie.

---

## 3. `type` i `interface`

```ts
// Alias typu
type ID = number | string;
type Status = "active" | "done";          // union literałów
type Point = { x: number; y: number };

// Interfejs
interface User {
  id: number;
  name: string;
  email?: string;        // pole opcjonalne
  readonly createdAt: Date;
}

// Rozszerzanie
interface Admin extends User {
  role: "admin";
}

// Łączenie typów (intersection)
type AdminUser = User & { permissions: string[] };
```

### Różnice `type` vs `interface`

| | `type` | `interface` |
|---|---|---|
| Union (`A \| B`) | tak | nie |
| Rozszerzanie | `&` | `extends` |
| Ponowna deklaracja (merge) | nie | tak |
| Typy prymitywne / krotki | tak | nie |

### Inne typy podstawowe

```ts
let a: string = "tekst";
let b: number = 5;
let c: boolean = true;
let d: string[] = ["a", "b"];
let e: Array<number> = [1, 2];
let f: [string, number] = ["wiek", 20];   // krotka
let g: unknown;                            // bezpieczniejsze niż any
let h: any;                                // wyłącza sprawdzanie typów
function log(): void {}                    // brak zwracanej wartości
function fail(): never { throw new Error(); }
```

### Funkcje

```ts
function add(a: number, b: number): number {
  return a + b;
}

const greet = (name: string, greeting = "Cześć"): string => `${greeting}, ${name}`;

type Callback = (value: number) => void;
```

### Generyki

```ts
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

interface Box<T> { value: T; }
```

### Zawężanie typów (narrowing)

```ts
function print(x: string | number) {
  if (typeof x === "string") {
    console.log(x.toUpperCase());
  } else {
    console.log(x.toFixed(2));
  }
}
```

---

## 4. `class`

```ts
class Person {
  // pola
  public name: string;
  private age: number;
  protected id: number;
  readonly createdAt = new Date();
  static count = 0;

  constructor(name: string, age: number, id: number) {
    this.name = name;
    this.age = age;
    this.id = id;
    Person.count++;
  }

  // metoda
  greet(): string {
    return `Cześć, jestem ${this.name}`;
  }

  // getter / setter
  get years(): number {
    return this.age;
  }
  set years(value: number) {
    if (value < 0) throw new Error("Wiek nie może być ujemny");
    this.age = value;
  }

  static create(name: string): Person {
    return new Person(name, 0, Person.count + 1);
  }
}
```

### Skrócony konstruktor (parameter properties)

```ts
class Product {
  constructor(
    public name: string,
    private price: number,
    readonly sku: string
  ) {}
}
```

### Modyfikatory dostępu

| Modyfikator | Dostęp |
|---|---|
| `public` (domyślny) | wszędzie |
| `private` | tylko wewnątrz klasy |
| `protected` | klasa i klasy pochodne |
| `readonly` | tylko odczyt po inicjalizacji |
| `static` | należy do klasy, nie do instancji |

### Dziedziczenie

```ts
class Employee extends Person {
  constructor(name: string, age: number, id: number, public position: string) {
    super(name, age, id);
  }

  override greet(): string {
    return `${super.greet()}, pracuję jako ${this.position}`;
  }
}
```

### Klasy abstrakcyjne i `implements`

```ts
abstract class Shape {
  abstract area(): number;
  describe(): string {
    return `Pole: ${this.area()}`;
  }
}

class Circle extends Shape {
  constructor(private r: number) { super(); }
  area(): number { return Math.PI * this.r ** 2; }
}

interface Printable {
  print(): void;
}

class Doc implements Printable {
  print(): void { console.log("Drukuję"); }
}
```

### Pola prywatne w JS

```ts
class Counter {
  #value = 0;               // prawdziwie prywatne (runtime)
  inc() { this.#value++; }
}
```

---

## 5. Moduły (ES Modules)

### Eksport

```ts
// math.ts
export const PI = 3.14159;
export function add(a: number, b: number): number { return a + b; }
export class Calculator {}
export type Operation = "add" | "sub";

export default function main() {}   // jeden na plik
```

### Import

```ts
import main, { PI, add, Calculator } from "./math.js";
import { add as sum } from "./math.js";      // alias
import * as math from "./math.js";           // wszystko jako obiekt
import type { Operation } from "./math.js";  // tylko typ (znika po kompilacji)
```

### Ważne zasady

- W HTML: `<script type="module" src="dist/main.js"></script>`.
- W importach przeglądarkowych podajemy rozszerzenie **`.js`** (nawet w pliku `.ts`), bo przeglądarka ładuje skompilowany JS.
- Moduły ładują się w trybie `strict`, mają własny zakres (zmienne nie wyciekają do `window`).
- Moduły w przeglądarce wymagają serwera (np. Live Server, `npx serve`) – nie działają z `file://` (błąd CORS).
- `export * from "./plik.js"` – re-eksport (plik `index.ts` jako "barrel").

---

## 6. `tsconfig.json`

### Inicjalizacja

```bash
npm init -y
npm install typescript --save-dev
npx tsc --init
```

### Przykładowa konfiguracja

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "node",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Najważniejsze opcje

| Opcja | Znaczenie |
|---|---|
| `target` | wersja JS wynikowego kodu (`ES5`, `ES2020`, `ESNext`) |
| `module` | system modułów (`ES2020`, `ESNext`, `commonjs`) |
| `lib` | dostępne typy wbudowane (np. `DOM` dla `document`, `window`) |
| `rootDir` | katalog źródłowy |
| `outDir` | katalog wyjściowy dla `.js` |
| `strict` | włącza wszystkie ścisłe sprawdzenia |
| `noImplicitAny` | zakaz domyślnego `any` (część `strict`) |
| `strictNullChecks` | `null`/`undefined` nie są przypisywalne do innych typów (część `strict`) |
| `sourceMap` | generuje `.map` do debugowania w przeglądarce |
| `include` / `exclude` | które pliki kompilować |
| `noEmitOnError` | nie generuj JS, gdy są błędy |
| `declaration` | generuj pliki `.d.ts` |

### Kompilacja

```bash
npx tsc            # jednorazowo, według tsconfig.json
npx tsc --watch    # tryb obserwacji (rekompilacja po zapisie)
```

### Skrypty w `package.json`

```json
{
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch"
  }
}
```

---

## 7. Częste błędy i pułapki

- Brak `.js` w ścieżce importu → przeglądarka nie znajduje modułu.
- Brak `type="module"` w `<script>` → `Cannot use import statement outside a module`.
- Brak `"DOM"` w `lib` → `Cannot find name 'document'`.
- `getElementById` może zwrócić `null` → użyj `as HTMLInputElement` lub sprawdzenia `if (el)`.
- Otwieranie `index.html` z dysku (`file://`) → błąd CORS dla modułów; użyj serwera lokalnego.
- Zapomniany `preventDefault()` w `submit` → strona się przeładowuje.
- Pomylone `private` (TypeScript, tylko kompilacja) z `#pole` (JS, runtime).
- Zmieniasz `.ts`, a przeglądarka ładuje stary `.js` → uruchom `tsc` lub `tsc --watch`.

---

## 8. Szybka ściągawka pytań na sprawdzian

1. Czym różni się `type` od `interface`?
2. Do czego służą modyfikatory `public`, `private`, `protected`, `readonly`, `static`?
3. Jak działa dziedziczenie (`extends`, `super`, `override`) i czym jest klasa abstrakcyjna?
4. Jak wyeksportować i zaimportować moduł? Czym różni się `export default` od nazwanego?
5. Co robią opcje `target`, `module`, `outDir`, `rootDir`, `strict` w `tsconfig.json`?
6. Jak podłączyć Bootstrap i do czego służą klasy `container`, `row`, `col-*`?
7. Jak działa siatka Bootstrapa i breakpointy?
8. Jak w aplikacji Todo dodać, usunąć i oznaczyć zadanie jako wykonane?
9. Po co `e.preventDefault()` w obsłudze formularza?
10. Dlaczego w importach TS podajemy rozszerzenie `.js`?
