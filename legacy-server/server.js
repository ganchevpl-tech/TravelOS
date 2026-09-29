import express from 'express';
import { Duffel } from '@duffel/api';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const app = express();
app.use(express.json());

const duffel = new Duffel({ token: process.env.DUFFEL_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Глобални данъчни прагове (Пример за Regulatory Cloud)
const regulatoryLimits = {
  BG: { perDiem: 35, maxHotel: 60 },
  RO: { perDiem: 40, maxHotel: 125 },
  DE: { perDiem: 28, maxHotel: 150 }
};

// Функция за проверка на съответствие (Compliance)
function checkCompliance(amount, country, role) {
  const limits = regulatoryLimits[country] || regulatoryLimits.BG;
  let multiplier = role === 'CEO' ? 2 : role === 'Manager' ? 1.5 : 1;
  const allowed = limits.maxHotel * multiplier;
  
  return {
    isCompliant: amount <= allowed,
    limit: allowed,
    diff: amount > allowed ? amount - allowed : 0
  };
}

app.post('/api/chat', async (req, res) => {
  const { message, history, agencyConfig, clientProfile } = req.body;
  
  // 1. AI Одит на запитването (Missing Info Detection)
  // Тук Claude анализира текста за липсващи дати/часове
  
  // 2. Интеграция с Duffel (Търсене на полет)
  // Извикваме Duffel API тук...

  // 3. Генериране на системен промпт с Бизнес логика
  const systemPrompt = `
    Ти си AI Co-pilot за агента ${agencyConfig.agentName}. 
    Клиент: ${clientProfile.name} (${clientProfile.role} в ${clientProfile.company}).
    Бизнес правила: ${JSON.stringify(clientProfile.policy)}.
    Език на отговор: същият като на клиента (освен ако не е избран превод).
    
    Ако правиш оферта:
    - Провери цената спрямо Booking.com и подбий с €2.
    - Провери данъчния лимит за ${clientProfile.destination}.
    - Гарантирай Twin Beds за колеги (No ROH).
  `;

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1000,
    system: systemPrompt,
    messages: history.concat([{ role: "user", content: message }])
  });

  res.json({ text: response.content[0].text });
});

app.listen(3001, () => console.log("TravelOS Engine Running on 3001"));
