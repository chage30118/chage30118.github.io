// 取今天日期，格式 yyyy-MM-dd
const today = new Date().toISOString().slice(0, 10);
// 你的 GAS Web App URL
const API_URL = 'https://script.google.com/macros/s/AKfycbzc2DEX44JNCe0bp9QNsHu3cGzmHyHMJ-lCkgvYdAns0NjPrBxdyrpTMVBFuXeNDv0v/exec';

// fetch 資料
fetch(`${API_URL}?api=schedules&date=${today}`)
  .then(res => res.json())
  .then(data => {
    console.log('排程資料：', data);
    // 暫時把 JSON 直接顯示在頁面上
    document.getElementById('app').textContent = JSON.stringify(data, null, 2);
  })
  .catch(err => console.error('Fetch 錯誤：', err));
