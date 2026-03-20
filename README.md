# AEAT MCP Server

Servidor [MCP](https://modelcontextprotocol.io) con datos fiscales españoles para asistentes de IA. Toda la información procede **exclusivamente de fuentes oficiales** (AEAT, BOE).

Conecta este servidor a Claude, ChatGPT, Copilot, Cursor o cualquier agente compatible con MCP y pregúntale sobre la declaración de la renta, deducciones, plazos, IVA, criptomonedas y más.

> **Aviso legal**: Esta herramienta proporciona datos meramente informativos y orientativos. No constituye asesoramiento fiscal. Consulte siempre con un profesional cualificado o verifique en la [AEAT](https://sede.agenciatributaria.gob.es).

---

Si este proyecto te resulta útil, dale una estrella en GitHub. Ayuda a que más gente lo encuentre.

---

## Índice

- [Qué es MCP](#qué-es-mcp)
- [Instalación](#instalación)
- [Ejemplos de uso](#ejemplos-de-uso)
- [Qué incluye](#qué-incluye)
  - [10 herramientas](#10-herramientas)
  - [Manual de la Renta 2025 completo](#manual-de-la-renta-2025-completo)
  - [Datos de referencia](#datos-de-referencia)
- [Integridad de los datos](#integridad-de-los-datos)
- [En números](#en-números)
- [Desarrollo](#desarrollo)
- [Licencia](#licencia)

---

## Qué es MCP

[Model Context Protocol](https://modelcontextprotocol.io) (MCP) es un estándar abierto que permite a los asistentes de IA (Claude, ChatGPT, Copilot, Cursor...) conectarse a fuentes de datos externas. Este servidor MCP da acceso a datos fiscales españoles oficiales, de forma que tu asistente puede responder preguntas sobre impuestos con información verificada y actualizada.

---

## Instalación

### Claude Desktop

Añade a tu `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "aeat": {
      "command": "npx",
      "args": ["-y", "aeat-mcp"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add aeat-mcp -- npx -y aeat-mcp
```

### VS Code / Cursor

Añade a `.vscode/mcp.json`:

```json
{
  "servers": {
    "aeat": {
      "command": "npx",
      "args": ["-y", "aeat-mcp"]
    }
  }
}
```

Reinicia la aplicación después de añadir la configuración. No hace falta instalar nada más: `npx` descarga y ejecuta el servidor automáticamente.

---

## Ejemplos de uso

Pregúntale a tu asistente de IA:

**Obligación de declarar**
- «¿Estoy obligado a declarar si gano 18.000 EUR con dos pagadores?»

**Rendimientos del trabajo**
- «Mi indemnización por despido de 45.000 EUR, ¿está exenta?»
- «Mi empresa me paga el coche, ¿cómo tributa la retribución en especie?»

**IRPF y deducciones**
- «¿Cuánto pago de IRPF en Madrid con 50.000 EUR brutos?»
- «¿Qué deducciones autonómicas hay en Baleares?»
- «¿Cuánto es la deducción por maternidad?»
- «¿Es mejor declarar conjunta o individual si mi pareja no trabaja?»

**Inversiones**
- «¿Cómo tributan los dividendos de acciones francesas?»
- «He vendido bitcoins con ganancias, ¿cómo lo declaro?»
- «He traspasado un fondo de inversión a otro, ¿tributa?»

**Alquileres**
- «Tengo un piso alquilado, ¿qué gastos me puedo deducir?»
- «Alquilo mi piso en Airbnb, ¿cómo tributa?»

**Autónomos**
- «¿Qué gastos se puede deducir un autónomo?»
- «¿Cuándo es el plazo para el Modelo 303?»

**Retenciones**
- «¿Por qué mi empresa me retiene un 24% de IRPF?»
- «Soy profesional autónomo nuevo, ¿qué retención me aplican?»

**Patrimonio**
- «¿Tengo que declarar el Impuesto sobre el Patrimonio?»
- «¿Cómo funciona el Impuesto de Solidaridad de Grandes Fortunas?»

**Otros**
- «¿Cómo funciona el rescate de un plan de pensiones?»
- «¿Es válido este NIF: 12345678Z?»
- «He presentado mal la declaración, ¿cómo la corrijo?»

---

## Qué incluye

### 10 herramientas

| Herramienta | Descripción |
|-------------|-------------|
| `get_vat_rates` | Tipos de IVA (21%, 10%, 4%), recargos de equivalencia, IGIC (Canarias) e IPSI (Ceuta y Melilla) |
| `get_irpf_brackets` | Tramos del IRPF — escala estatal general y del ahorro |
| `get_personal_minimums` | Mínimos personales y familiares (contribuyente, descendientes, ascendientes, discapacidad) |
| `get_indicators` | Indicadores económicos: IPREM, SMI, tipo de interés legal del dinero |
| `get_fiscal_calendar` | Plazos de la AEAT por año, trimestre o modelo. Indica el próximo vencimiento |
| `get_tax_form_info` | Información de 19 modelos fiscales (100, 303, 720...) — nombre, periodicidad, quién declara |
| `validate_tax_id` | Valida NIF, NIE y CIF (verificación del dígito de control) |
| `search_tax_rules` | Busca en todo el Manual de la Renta — rendimientos, deducciones, exenciones, ganancias |
| `search_casillas` | Busca casillas del Modelo 100 por número o palabra clave |
| `get_ccaa_deductions` | Deducciones autonómicas por comunidad (17 CCAA + Ceuta y Melilla, unas 350 deducciones) |

### Manual de la Renta 2025 completo

Todo el contenido del Manual Práctico de Renta 2025 de la AEAT, estructurado como datos consultables:

| Capítulo | Contenido |
|----------|-----------|
| Obligación de declarar | Umbrales del art. 96 LIRPF (22.000 / 15.876 EUR), casos obligatorios, regla transitoria |
| Rentas exentas | 30 exenciones del art. 7 LIRPF — despido (180.000), maternidad, becas, discapacidad, trabajo en el extranjero (60.100), loterías (40.000) |
| Rendimientos del trabajo | Sueldos, retribuciones en especie, dietas exentas, gastos deducibles, reducciones |
| Capital inmobiliario | Alquileres: 10 categorías de gastos, reducciones del 50 al 90%, imputación de rentas |
| Capital mobiliario | Dividendos, intereses, seguros, rentas vitalicias, PIAS, SIALP, régimen transitorio |
| Actividades económicas | Autónomos: estimación directa normal y simplificada, 14 categorías de gastos, amortización, RETA, pagos fraccionados |
| Ganancias patrimoniales | 8 tipos, método FIFO, traspasos de fondos (exentos), 10 exenciones, norma anti-abuso, compensación de pérdidas |
| Deducciones estatales | 16 deducciones: maternidad, familia numerosa, donativos, vehículo eléctrico, eficiencia energética, Ceuta y Melilla |
| Deducciones autonómicas | Unas 350 deducciones en las 17 CCAA + Ceuta y Melilla |
| Tramos autonómicos del IRPF | Escalas autonómicas de las 15 CCAA de régimen común + Ceuta y Melilla |
| Doble imposición internacional | Art. 80 LIRPF, 92 países con tipos de convenio, proceso de recuperación, ejemplo paso a paso |
| Criptomonedas | Compraventa, permutas, staking, minería, FIFO, casillas 1802-1806, Modelo 721 |
| Tributación conjunta | 2 modalidades de unidad familiar, reducciones de 3.400 / 2.150 EUR, cuándo conviene |
| Alquiler turístico | Sin reducción del 50-90%, gastos proporcionales, imputación de días vacíos, IVA, DAC7 |
| Planes de pensiones | Rescate: 3 formas, reducción del 40% para aportaciones anteriores a 2007, límites |
| Pensión compensatoria | Reducción para el pagador (art. 55), anualidades por alimentos a hijos (art. 64, escala separada) |
| Retenciones | Escala de retención (6 tramos, 19%-47%), mínimos por situación familiar, tipos fijos, exclusiones, regularización, Modelo 145 |
| Procedimiento de corrección | Autoliquidación rectificativa (Ley 13/2023) y complementaria, recargos, pago en dos plazos, prescripción |
| Patrimonio y Grandes Fortunas | Impuesto sobre el Patrimonio (Ley 19/1991): tarifa, exenciones, CCAA. ITSGF (Modelo 718): tarifa, umbrales |
| Casillas del Modelo 100 | Más de 50 casillas mapeadas con su artículo de la LIRPF |

### Datos de referencia

| Dominio | Años | Fuente oficial |
|---------|------|----------------|
| Tipos de IVA, recargos, IGIC, IPSI | 2025 | Ley 37/1992, RDL 4/2024 |
| Tramos IRPF (estatal + 15 CCAA) | 2025 | Ley 35/2006, Ley 7/2024, legislación autonómica |
| Mínimos personales y familiares | 2025 | Ley 35/2006, arts. 57-61 |
| Indicadores (IPREM, SMI, tipo legal) | 2025-2026 | Ley 31/2022, RD 87/2025, RD 126/2026 |
| Calendario fiscal | 2026 | AEAT — Calendario del Contribuyente 2026 |
| Catálogo de modelos | 19 modelos | AEAT — sede electrónica |
| Convenios de doble imposición | 92 países | AEAT — Manual de Tributación de No Residentes |

---

## Integridad de los datos

Cada dato incluye un campo `source` con la referencia exacta a la ley, artículo y referencia del BOE.

**Fuentes prohibidas**: blogs, consultorías, medios de comunicación o cualquier fuente no oficial.

**Solo fuentes oficiales**:
- [AEAT](https://sede.agenciatributaria.gob.es) (Agencia Tributaria)
- [BOE](https://boe.es) (Boletín Oficial del Estado)
- Boletines oficiales autonómicos (BOJA, BOCM, DOGC, etc.)
- [Seguridad Social](https://seg-social.es)

---

## En números

| | |
|---|---|
| Herramientas | 10 |
| Archivos de datos | 28 |
| Líneas de datos fiscales | 14.933 |
| Tests automatizados | 52 |
| Capítulos del manual | 18 |
| Deducciones autonómicas | ~350 |
| Países con convenio de doble imposición | 92 |
| Tipos de rentas exentas | 30 |
| Modelos fiscales catalogados | 19 |
| Plazos del calendario fiscal | 53 |

---

## Desarrollo

```bash
git clone https://github.com/iMark21/aeat-mcp.git
cd aeat-mcp
npm install
npm run build
npm test
```

---

## Licencia

MIT — (c) iMark Apps
