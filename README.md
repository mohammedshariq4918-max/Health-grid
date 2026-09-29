# HEALTHGRID AI — Smart Health & Supply Chain Monitor

[![Hackathon Track](https://img.shields.io/badge/Track-Smart%20Health%20%26%20Supply%20Chain-blue.svg)](https://github.com)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)
[![Framework](https://img.shields.io/badge/Stack-React%2019%20%7C%20TypeScript%20%7C%20Express%20%7C%20Tailwind-sky.svg)](https://react.dev/)

An intelligent medicine inventory monitoring, stock-out forecasting, and inter-facility redistribution platform designed for Primary Health Centres (PHCs). Built specifically for the **Smart Health & Supply Chain** hackathon track.

---

## 🏥 Clinical Problem & Solution

Public health centres in rural and semi-urban districts frequently experience catastrophic stock-outs of life-saving medicines (such as Anti-Rabies Vaccines, broad-spectrum antibiotics, and pediatric ORS) due to sudden seasonal surges, epidemiological outbreaks, and distribution delays from central medical stores. Concurrently, larger urban facilities within a 50 km radius often hold surplus stock exceeding 30 to 45 days of supply.

**HEALTHGRID AI** continuously monitors stock levels across peripheral health centres, models depletion run-rates using transparent formulas, stress-tests inventories against simulated demand surges, and algorithmically coordinates peer-to-peer inter-facility redistributions.

---

## 🏛️ Health Facilities Monitored (Mysuru District Benchmark)

The prototype operates with realistic synthetic operational data for three designated public health centres in Mysuru District, Karnataka:

1. **Mysuru Urban PHC (UPHC - Category A)**
   - *Catchment Population:* 48,500 | *Beds:* 12 | *Doctors:* 4
   - *Role:* Central district hub with substantial buffer reserves (serves as donor for inter-facility balancing).
2. **Nanjangud Taluk PHC (Category B)**
   - *Catchment Population:* 34,200 | *Beds:* 8 | *Doctors:* 2
   - *Status:* Moderate outpatient volume; currently experiencing acute shortages in Amoxicillin capsules and chronic Metformin maintenance therapies.
3. **Hunsur Community Health Post (Category C - Border/Tribal)**
   - *Catchment Population:* 29,100 | *Beds:* 6 | *Doctors:* 2
   - *Status:* Critical life-safety deficit in Anti-Rabies Vaccine (only 1.8 days left) and acute pediatric ORS dehydration supplies.

---

## 💊 Monitored Essential Medicines

At least 8 essential medications from the National List of Essential Medicines (NLEM) are continuously tracked across all 3 PHCs:

| Code | Medicine Name | Category | Unit | Storage Spec |
|------|---------------|----------|------|--------------|
| `MED-PCM-500` | Paracetamol 500mg Tablets | Analgesics / Antipyretic | Tablets | Room Temp (15-25°C) |
| `MED-AMX-500` | Amoxicillin 500mg Capsules | Broad-Spectrum Antibiotic | Capsules | Dry Store (<25°C) |
| `MED-ORS-20` | Oral Rehydration Salts 20.5g | Electrolytes / Dehydration | Sachets | Moisture-proof (<30°C) |
| `MED-MET-500` | Metformin 500mg Tablets | Chronic / NCD Diabetes | Tablets | Room Temp (20-25°C) |
| `MED-AML-5` | Amlodipine 5mg Tablets | Cardiovascular / Hypertension | Tablets | Protect from light |
| `MED-RAB-05` | Anti-Rabies Vaccine (Inj. 0.5ml) | Vaccines & Immunoglobulins | Vials | **Cold Chain (2°C - 8°C)** |
| `MED-IFA-100` | Iron & Folic Acid (IFA) Tablets | Maternal & Child Health | Tablets | Room Temp (<25°C) |
| `MED-ART-60` | Artesunate 60mg Injection | Emergency Anti-Malarial | Vials | Store <25°C |

---

## 📐 Transparent Forecasting & Redistribution Formulation

HEALTHGRID AI deliberately avoids opaque "black-box" predictions. All calculations are 100% explainable and grounded in arithmetic run-rates:

### 1. Effective Daily Usage Run-Rate
$$\text{Usage}_{\text{effective}} = \text{BaseUsage} \times \left(1 + \frac{\text{Surge}\%}{100}\right)$$

### 2. Days of Supply Remaining
$$\text{DaysLeft} = \frac{\text{Current Physical Stock}}{\text{Usage}_{\text{effective}}}$$

- **Critical Hazard:** $\text{DaysLeft} \le 3.0$ days (or stock $< 40\%$ of buffer reserve)
- **Warning Risk:** $\text{DaysLeft} \le 7.0$ days (or stock $<$ minimum buffer reserve)
- **Adequate:** $8.0 \le \text{DaysLeft} \le 24.0$ days
- **Surplus Hub:** $\text{DaysLeft} \ge 25.0$ days

### 3. Pipeline Deliveries
$$\text{DaysWithIncoming} = \frac{\text{Current Physical Stock} + \text{Incoming Pipeline Quantity}}{\text{Usage}_{\text{effective}}}$$

### 4. Algorithmic Redistribution Heuristic
- **Recipient Qualification:** Any facility with $\text{DaysLeft} \le 7.0$ days.
- **Donor Qualification:** Any facility with $\text{DaysLeft} \ge 18.0$ days.
- **Donor Safety Constraint:** The donor must retain at least 18 days of consumption after the transfer:
  $$\text{DonorSafeReserve} = \lceil \text{Usage}_{\text{donor}} \times 18 \rceil$$
  $$\text{DonorSpareStock} = \max(0, \text{CurrentStock}_{\text{donor}} - \text{DonorSafeReserve})$$
- **Recipient Target:** Elevate recipient to 14 days of safe operating stock:
  $$\text{RecipientDeficit} = \max(0, \lceil \text{Usage}_{\text{recipient}} \times 14 \rceil - \text{CurrentStock}_{\text{recipient}})$$
- **Recommended Transfer Quantity:**
  $$\text{TransferQty} = \min(\text{RecipientDeficit}, \text{DonorSpareStock})$$

---

## ⚡ Key Interactions & Features

1. **Overview Dashboard:** District Health Officer command view with KPI metrics, health scores, 7-day alert banner, and recent movement audit trail.
2. **Health Facility Profiles:** Capacity, doctors, pharmacists, cold-chain ILR telemetry, and inter-facility road transit matrix (e.g. NH 766, SH 88).
3. **Medicine Inventory Table:** Real-time stock, batch numbers, expiry dates, search, and multi-tier status badges.
4. **Interactive Stock Logging:** Allows logging dispensing, receiving incoming shipments, or recording physical audit counts with instant recalculation.
5. **Shortage Forecast & Radar:** Depletion timeline with interactive demand surge slider (0% to +150%) and epidemiological scenario presets (Monsoon Dengue, Viral Flu, Epidemic Spike).
6. **Redistribution Planner:** Mathematical explanations for every transfer recommendation with an **Approve & Execute Transfer** button that updates live facility inventory and logs dispatch records.
7. **Custom Transfer Creator:** Allows dispatching ad-hoc consignments between any two facilities with travel time and buffer impact estimation.
8. **AI Supply Chain Assistant:**
   - Powered by `@google/genai` with model `gemini-3.8-flash` on the server when `GEMINI_API_KEY` is present.
   - **Transparent Demo Explanation Mode:** If Gemini API is not configured, provides deeply grounded, non-hallucinated explanations based on the actual live application state.
   - Prominently displays AI mode badge (`✨ Gemini 3.8 Flash (Live)` vs `ℹ️ Demo AI Engine (Simulated)`).
   - Zero patient identifiable personal data is required or handled.
9. **Sample Data Reset:** One-click reset in header to restore default synthetic benchmark figures anytime.

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### Installation

1. Clone or download the repository:
   ```bash
   git clone <repo-url>
   cd healthgrid-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Configure Gemini API Key:
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   PORT=3000
   ```
   *Note: If no API key is provided, the application runs seamlessly in **Demo AI Explanation Mode**.*

4. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 How to Build and Deploy

1. Build production bundle:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm run start
   ```

3. **Cloud Run / Container Deployment:**
   The application uses an Express server (`server.ts`) listening on `process.env.PORT` (defaults to 3000). To deploy to Cloud Run or any container platform:
   - Ensure `npm run build` is executed.
   - Set container start command to `node server.ts` or `npm run start`.
   - Set environment variable `NODE_ENV=production`.

---

## 🛡️ Privacy & Compliance Notice

HEALTHGRID AI is strictly a medical supply chain and public health logistics platform. It does not collect, store, or transmit patient personal health information (PHI/PII). All calculations are conducted on aggregate facility stock counts and consumption velocity rates. All predictions and benchmark data are simulated for the Smart Health & Supply Chain Hackathon.
