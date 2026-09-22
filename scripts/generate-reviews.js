const puppeteer = require('puppeteer');
const fs = require('fs');

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz4LdbqOFl0s22lBDGSk-6sMKjVpYLWV2O-xRnHyFg-CgPd7O0TjYt-9ZXJmpPXtccdUA/exec?action=getReviews';

function generateStarSVG(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    const fill = i <= rating ? '#EAB308' : 'none'; // Yellow or none
    const stroke = i <= rating ? '#EAB308' : '#30363D';
    stars += `<svg width="20" height="20" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
  }
  return stars;
}

async function generateReviews() {
  console.log('Fetching reviews...');
  const response = await fetch(APPS_SCRIPT_URL);
  const reviews = await response.json();
  console.log(`Fetched ${reviews.length} reviews.`);

  // Limit to most recent 3 or 4 to fit in the image
  const visibleReviews = reviews.slice(0, 4);

  const cardsHtml = visibleReviews.map(review => `
    <div class="card">
      <div class="stars">${generateStarSVG(review.rating)}</div>
      <p class="comment">"${review.comment}"</p>
      <div class="author">
        <img src="${review.avatar}" alt="${review.name}" class="avatar" />
        <span class="name">${review.name || review.github}</span>
      </div>
    </div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body {
          margin: 0;
          font-family: 'Inter', sans-serif;
          background-color: #0d1117;
          background-image: url('https://rahulpamula.me/rahul_background.png');
          background-size: cover;
          background-position: center;
          width: 900px;
          min-height: 400px;
          display: flex;
          flex-direction: column;
          padding: 40px;
          box-sizing: border-box;
          color: #c9d1d9;
        }
        .overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(13, 17, 23, 0.4);
          z-index: 0;
        }
        .content {
          position: relative;
          z-index: 1;
        }
        h2 {
          color: white;
          font-size: 28px;
          margin-top: 0;
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        }
        .subtitle {
          color: rgba(255, 255, 255, 0.8);
          font-size: 16px;
          margin-bottom: 30px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.8);
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        .card {
          background: rgba(10, 18, 28, 0.55);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(120, 180, 200, 0.15);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
        .stars {
          display: flex;
          margin-bottom: 16px;
        }
        .comment {
          font-size: 15px;
          line-height: 1.6;
          color: #e6edf3;
          margin: 0 0 24px 0;
          flex-grow: 1;
          font-style: italic;
        }
        .author {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(120, 180, 200, 0.3);
        }
        .name {
          font-weight: 600;
          color: white;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="overlay"></div>
      <div class="content">
        <h2>Contributor Voices</h2>
        <div class="subtitle">Feedback from developers and maintainers I've collaborated with.</div>
        <div class="grid">
          ${cardsHtml}
        </div>
      </div>
    </body>
    </html>
  `;

  console.log('Launching puppeteer...');
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 400 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  // Wait a bit to ensure background and fonts load
  await new Promise(r => setTimeout(r, 2000));
  
  const contentHeight = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewport({ width: 900, height: contentHeight });
  
  await page.screenshot({ path: 'reviews.png', type: 'png' });
  console.log('Screenshot saved to reviews.png');
  
  await browser.close();
}

generateReviews().catch(err => {
  console.error(err);
  process.exit(1);
});
