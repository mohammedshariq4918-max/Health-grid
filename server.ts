import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'HEALTHGRID AI Backend',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// AI Explanation endpoint using Gemini API
app.post('/api/ai-explain', async (req, res) => {
  const { prompt, queryType, activeSurgePercent, criticalItems, transferSummary, activeCentre } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;

  // If Gemini API is configured, call Gemini 3.8 Flash
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `You are HEALTHGRID AI, an expert clinical supply chain analyst for primary health centres (PHCs) in Karnataka, India (specifically Mysuru PHC, Nanjangud PHC, and Hunsur PHC).
Your goal is to explain medicine inventory balances, consumption rates, stockout risks, and inter-facility transfer recommendations in clear, concise, actionable language.
Important rules:
1. Do not ask for or reference any patient personal identifiable information. All operations are strictly facility-level medicine logistics.
2. Ground all calculations in the provided inventory context (current stock, daily usage run-rates, buffer reserves, and transfer routes).
3. If an item is critical (e.g. Anti-Rabies Vaccine at Hunsur PHC), emphasize the clinical gravity (e.g., Rabies post-exposure prophylaxis is 100% fatal if untreated).
4. Use clean Markdown headings, bullet points, and bold metric highlights.`;

      const contextDescription = `Current Facility Context:
- Active Demand Surge: +${activeSurgePercent || 0}% multiplier on baseline consumption
- Active Centre Filter: ${activeCentre || 'All Facilities (District View)'}
- Critical Items (<7 days): ${JSON.stringify(criticalItems || [])}
- Recommended Inter-Facility Transfers: ${JSON.stringify(transferSummary || [])}

User Question: ${prompt}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contextDescription,
        config: {
          systemInstruction,
          temperature: 0.4,
        },
      });

      const explanation = response.text || 'Analysis generated successfully.';
      return res.json({
        mode: 'live',
        explanation,
      });
    } catch (error) {
      console.warn('Gemini API call failed, falling back to transparent demo engine:', error);
      // Fallback gracefully below
    }
  }

  // Graceful transparent simulated demo explanation engine
  return res.json({
    mode: 'demo',
    simulated: true,
    explanation: generateSimulatedExplanation(prompt, activeSurgePercent, criticalItems, transferSummary),
  });
});

function generateSimulatedExplanation(
  prompt: string,
  surge: number,
  criticalItems: any[],
  transfers: any[]
): string {
  const q = (prompt || '').toLowerCase();

  if (q.includes('rabies') || q.includes('hunsur') || q.includes('vaccine')) {
    return `### 🚨 Urgent Assessment: Anti-Rabies Vaccine (ARV) Stockout at Hunsur PHC

**Clinical Emergency Overview:**
- **Facility:** Hunsur Border PHC (Serving 29,100 people across rural & tribal fringes)
- **Stock on Hand:** **7 Vials**
- **Depletion Horizon:** **1.75 Days** (Estimated stock-out within 42 hours)
- **Safe Buffer Threshold:** 25 Vials

**Clinical Implication:**
Rabies Post-Exposure Prophylaxis (PEP) carries a 100% fatality rate upon symptom onset. Stockouts force patients to travel 46 km into Mysuru city or default on PEP regimens.

**Algorithmic Redistribution Fix:**
- **Donor Hub:** Mysuru Urban PHC holds **160 vials** (32 days of supply).
- **Proposed Transfer:** **40 vials** dispatched via SH 88 (46 km, ~68 mins).
- **Post-Transfer Balance:**
  - Hunsur PHC reaches **11.75 days safe buffer** (47 vials).
  - Mysuru PHC retains **120 vials** (24 days supply), staying comfortably above the 18-day district safety baseline.
- **Logistics Instruction:** Active cold-chain carrier (2°C to 8°C with digital temp logger) required during transit.`;
  }

  if (q.includes('surge') || q.includes('fever') || q.includes('dengue') || q.includes('epidemic')) {
    return `### 📈 Predictive Surge Impact Analysis (+${surge || 0}% Demand Multiplier)

**Run-Rate Stress Testing Results:**
Applying an epidemiological surge factor of **+${surge || 0}%**:

1. **Paracetamol 500mg Tablets:**
   - **Mysuru PHC:** Usage climbs from 120 to **${Math.round(120 * (1 + (surge || 0)/100))} tablets/day**. Remains secure with high stockpile.
   - **Nanjangud PHC:** Stock depletes from 10.0 days down to **${(950 / (95 * (1 + (surge || 0)/100))).toFixed(1)} days**.
   - **Hunsur PHC:** Stock drops down to **${(680 / (80 * (1 + (surge || 0)/100))).toFixed(1)} days**.

2. **Amoxicillin 500mg Capsules:**
   - Acute distress at Nanjangud PHC: Only **${(170 / (55 * (1 + (surge || 0)/100))).toFixed(1)} days of coverage** remaining.

**Recommended Logistics Response:**
Execute pre-emptive transfer of 600 Amoxicillin capsules and 800 Paracetamol strips from Mysuru PHC before community demand reaches peak intensity.`;
  }

  if (q.includes('indent') || q.includes('procurement') || q.includes('order')) {
    return `### 📋 Automated District Medical Indent Protocol
**To:** District Health & Family Welfare Officer (DHO), Mysuru District  
**From:** HEALTHGRID AI Autonomous Rebalancing System  
**Subject:** Emergency Indent & Buffer Replenishment Protocol  
**Date:** 29-Sep-2026 (Simulated Run)

**Urgent Consignments Requested for Central Depot Dispatch:**
1. **Anti-Rabies Vaccine 0.5ml:** 100 Vials (Target: Hunsur PHC & District Buffer)
2. **Amoxicillin 500mg Capsules:** 3,000 Capsules (Target: Nanjangud PHC)
3. **Oral Rehydration Salts (ORS):** 2,500 Sachets (Target: Hunsur & Nanjangud)
4. **Metformin 500mg Tablets:** 2,000 Tablets (Target: Nanjangud PHC)

**Interim Safeguard:**
Peer-to-peer redistribution between Mysuru PHC and peripheral units has been computed to bridge therapy gaps until central depot delivery arrives.`;
  }

  return `### 📊 Real-Time Supply Chain & Inventory Evaluation

- **Facilities Monitored:** 3 (Mysuru Urban PHC, Nanjangud Rural PHC, Hunsur Border PHC)
- **Active Surge Multiplier:** +${surge || 0}% daily run-rate
- **Active Critical Stockouts (≤3 days):** Anti-Rabies Vaccine (Hunsur), ORS (Hunsur), Amoxicillin (Nanjangud)
- **Redistribution Heuristic:** Prioritizes transfers where donor retains ≥ 18 days buffer and recipient achieves ≥ 14 days safety.

*(Note: Operating in Demo AI Explanation Mode. No API key required for this simulation).*`;
}

// Start Server with Vite or Static
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HEALTHGRID AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
