const today = new Date().toISOString().slice(0, 10);
const API_URL = 'https://script.google.com/macros/s/AKfycbzc2DEX44JNCe0bp9QNsHu3cGzmHyHMJ-lCkgvYdAns0NjPrBxdyrpTMVBFuXeNDv0v/exec';  // 換成你的 URL

fetch(`${API_URL}?api=schedules&date=${today}`)
  .then(res => res.json())
  .then(data => {
    const tbody = document.querySelector('#schedule-table tbody');
    tbody.innerHTML = '';  // 先清空

    data.forEach(item => {
      const tr = document.createElement('tr');

      // 按照欄位順序，依序建立 <td>
      [
        item.line,
        item.channel || '—',
        item.item,
        item.people,
        item.startTime,
        item.estEndTime
      ].forEach(text => {
        const td = document.createElement('td');
        td.textContent = text;
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  })
  .catch(err => {
    console.error('載入排程失敗：', err);
    document.body.insertAdjacentHTML('beforeend',
      '<p style="color:red;">無法取得排程資料，請稍後再試。</p>');
  });
