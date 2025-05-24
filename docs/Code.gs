// Google Sheets URL
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1YFGCZskv26JyoFgHIi1mwHtlmd7ZdD58q5m7XWj7vh8/edit?gid=0#gid=0';
const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);

// 路由對象，用於處理不同的頁面請求
var Route = {};

// 定義路由方法
Route.path = function(route, callback) {
  Route[route] = callback;
};

// 處理 GET 請求
function doGet(e) {
   // 1. 如果有 api 參數，回傳 JSON
  if (e.parameter.api === 'schedules') {
    // 2. 讀取 date 參數，若沒帶就用今天
    const date = e.parameter.date ||
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    // 3. 呼叫既有的 getSchedulesByDate，取得陣列
    const data = getSchedulesByDate(date);
    // 4. 把陣列轉 JSON 並回傳
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  




  // 設置路由
  Route.path("index", loadindex);
  Route.path("page1", loadpage1);
  Route.path("page2", loadpage2);
  Route.path("page2show", loadpage2show);

  // 根據參數選擇對應的頁面
  if (Route[e.parameters.v]) {
    return Route[e.parameters.v]();
  } else {
    return render("home");
  }
}

// 加載 index 頁面
function loadindex() {
  return render("index");
}

// 加載 page1 頁面
function loadpage1() {
  return render("page1");
}

// 加載 page2 頁面
function loadpage2() {
  return render("page2");
}

// 加載 page2show 頁面
function loadpage2show() {
  return render("page2show");
}


function getAppUrl() {
  Logger.log(ScriptApp.getService().getUrl())
  return ScriptApp.getService().getUrl();
}


// 從 Google Sheets 獲取任務數據
function getTasksFromSheet() {
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const sheet = ss.getSheetByName('日排程整理');
  const data = sheet.getDataRange().getValues().slice(1);

  // 將數據轉換為任務對象
  const tasks = data.map(row => ({
    name: row[3],
    duration: parseFloat(row[7]), // 轉換為數值型別
    type: row[1]
  }));

  return JSON.stringify(tasks);
}

// 將任務數據寫回 Google Sheets
function writeTasksToSheet(tasks) {
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const sheet = ss.getSheetByName('test1');

  // 清除現有資料 (除了標題列)
  sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();

  // 將 JSON 資料寫回試算表
  const dataToWrite = tasks.map(task => [task.name, task.duration]);
  sheet.getRange(2, 1, dataToWrite.length, dataToWrite[0].length).setValues(dataToWrite);
}

// 獲取品項備註
function getItemNotes() {
  const sheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL).getSheetByName('備註對照表');
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  
  const notes = {};
  data.forEach(function(row) {
    const item = row[0];
    const note = row[1];
    if (item) {
      notes[item] = note;
    }
  });
  
  return notes;
}

// 將工時計算機的資料存回 "日排程整理" 的工作表
function saveScheduleData(data) {
  const sheet = ss.getSheetByName('日排程整理');
  if (!sheet) {
    throw new Error('找不到名為「日排程整理」的工作表');
  }

  // 添加一行新數據
  sheet.appendRow([
    data.date,
    data.line,
    data.channel,
    data.item,
    data.people,
    data.newguy,
    data.pieces,
    data.workhours,
    data.note,
    data.orderid
  ]);

  return 'success';
}

// 取得指定日期的所有線別名稱
function getLinesByDate(date) {
  const sheet = ss.getSheetByName('日排程整理');
  if (!sheet) {
    throw new Error('找不到名為「日排程整理」的工作表');
  }
  const data = sheet.getDataRange().getValues();
  const linesSet = new Set();
  for (let i = 1; i < data.length; i++) { // 跳過標題列
    if (data[i][0] == date) {
      linesSet.add(data[i][1]); // 假設第2欄是線別
    }
  }
  return Array.from(linesSet);
}

// 整合：取得指定日期的線別與任務資料
// function getScheduleByDate(date) {
//   const sheet = ss.getSheetByName('日排程整理');
//   if (!sheet) {
//     throw new Error('找不到名為「日排程整理」的工作表');
//   }
//   const data = sheet.getDataRange().getValues();
//   const linesSet = new Set();
//   const tasks = [];
//   for (let i = 1; i < data.length; i++) { // 跳過標題列
//     if (data[i][0] == date) {
//       linesSet.add(data[i][1]); // 第2欄是線別
//       tasks.push({
//         name: data[i][3], // 第4欄是任務名稱
//         duration: parseFloat(data[i][7]), // 第8欄是時數
//         type: data[i][1] // 第2欄是線別/型別
//       });
//     }
//   }
//   return JSON.stringify({
//     lines: Array.from(linesSet),
//     tasks: tasks
//   });
// }


function getSchedulesByDate(date) {
  const sheet = ss.getSheetByName('日排程整理');
  const data = sheet.getDataRange().getValues();
  const result = [];

  for (let i = 1; i < data.length; i++) {
    const cellDate = data[i][0];
    if (!cellDate) continue;
    const rowDate = Utilities.formatDate(new Date(cellDate), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    if (rowDate === date && data[i][1]) {
      Logger.log(data[i][11])
      result.push({
        date: rowDate,
        line: data[i][1],
        channel: data[i][2],
        item: data[i][3],
        people: data[i][4],
        newguy: data[i][5],
        pieces: data[i][6],
        workhours: data[i][7],
        note: data[i][8],
        orderid: data[i][9],
        order: data[i][10] || 9999,
        startTime: formatTimeStringRounded(data[i][11]),
        estEndTime: formatTimeStringRounded(data[i][12]),
        realEndTime: formatTimeStringRounded(data[i][13]),
        locked: data[i][14] === 1,  // O欄 = 1 表示已結束（鎖定）
        slot1:   data[i][15] === 1,    // 新增：是否為展示1
        slot2:   data[i][16] === 1     // 新增：是否為展示2
      });
    }
  }

  result.sort((a, b) => {
    if (a.line === b.line) return a.order - b.order;
    return a.line.localeCompare(b.line);
  });

  return result;
}


/**
 * ✅ Date 物件 → 時間字串（用於前端）
 * ⚠ 無捨入，只保留 hh:mm（正確避免08:23誤轉為08:30）
 */
function formatTimeStringRounded(t) {
  if (!t) return '';
  let h = 0, m = 0;
  if (Object.prototype.toString.call(t) === '[object Date]') {
    h = t.getHours();
    m = t.getMinutes();
  } else if (typeof t === 'string' && t.includes(':')) {
    [h, m] = t.split(':').map(Number);
  } else {
    return String(t);
  }
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm}`;
}


/**
 * ✏️ 編輯排程（根據 orderid）
 * 更新品項、人數、盒數、備註、實際結束時間
 */
function updateSchedule(orderId, data) {
  const sheet = ss.getSheetByName('日排程整理');
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (values[i][9] === orderId) { // J欄 = 單號
      sheet.getRange(i + 1, 1).setValue(data.date);                      // A: 日期
      sheet.getRange(i + 1, 2).setValue(data.line);                      // B: 線別
      sheet.getRange(i + 1, 3).setValue(data.channel);                   // C: 通路
      sheet.getRange(i + 1, 4).setValue(data.item);                      // D: 品項
      sheet.getRange(i + 1, 5).setValue(data.people);                    // E: 人數
      sheet.getRange(i + 1, 6).setValue(data.newguy || 0);               // F: 新人數
      sheet.getRange(i + 1, 7).setValue(data.pieces);                    // G: 盒數
      sheet.getRange(i + 1, 8).setValue(data.workhours);                 // H: 預估工時
      sheet.getRange(i + 1, 9).setValue(data.note);                      // I: 備註
      sheet.getRange(i + 1, 14).setValue(data.realEndTime);             // N: 實際結束時間
      sheet.getRange(i + 1, 15).setValue(data.realEndTime ? 1 : '');    // O: 是否鎖定

      return 'success';
    }
  }

  throw new Error('❌ 找不到單號：' + orderId);
}
/**
 * 🔁 排序後更新線別與順序
 * @param {Array} updates - 每筆包含 orderid, line, order (新順序)
 */
function updateScheduleLineAndOrder(updates) {
  const sheet = ss.getSheetByName('日排程整理');
  const data = sheet.getDataRange().getValues();

  updates.forEach(update => {
    const index = data.findIndex(row => row[9] === update.orderid); // J欄 = 單號
    if (index !== -1) {
      sheet.getRange(index + 1, 2).setValue(update.line);   // B: 線別
      sheet.getRange(index + 1, 11).setValue(update.order); // K: 排序
    }
  });
}

/**
 * ➕ 新增排程
 * @param {Object} data - 包含所有排程欄位
 */
function addNewSchedule(data) {
  const sheet = ss.getSheetByName('日排程整理');

  const newRow = [
    data.date,                                 // A: 日期
    data.line,                                 // B: 線別
    data.channel,                              // C: 通路
    data.item,                                 // D: 品項
    data.people,                               // E: 人數
    data.newguy || 0,                          // F: 新人數
    data.pieces,                               // G: 盒數
    data.workhours,                            // H: 預估工時
    data.note,                                 // I: 備註
    data.orderid,                              // J: 單號
    getNextOrderIndex(data.date, data.line), // 自動取得排序編號
    "",                                        // L: 開始時間（由排序邏輯自動帶入）
    "",                                        // M: 預估結束時間（由排序邏輯自動帶入）
    data.realEndTime ? parseTimeStringToDateObject(data.realEndTime) : "",  // N: 實際結束時間
    data.realEndTime ? 1 : ""                  // O: 排程已結束（旗標）
  ];

  sheet.appendRow(newRow);
}


/**
 * ⏱ 更新排程的排序、線別、開始時間與預估結束時間
 * @param {Array} updates - 含 orderid, line, order, startTime, estEndTime, realEndTime（可選）
 */
function updateScheduleTimeAndOrder(updates) {
  const sheet = ss.getSheetByName('日排程整理');
  const data = sheet.getDataRange().getValues();

  updates.forEach(update => {
    const idx = data.findIndex(row => row[9] === update.orderid); // J欄 = 單號
    if (idx !== -1) {
      const row = idx + 1;

      if (update.line !== undefined) {
        sheet.getRange(row, 2).setValue(update.line); // B: 線別
      }
      if (update.order !== undefined) {
        sheet.getRange(row, 11).setValue(update.order); // K: 排序
      }
      if (update.startTime !== undefined) {
        const start = parseTimeStringToDateObject(update.startTime);
        sheet.getRange(row, 12).setValue(start); // L: 開始時間
      }
      if (update.estEndTime !== undefined) {
        const est = parseTimeStringToDateObject(update.estEndTime);
        sheet.getRange(row, 13).setValue(est); // M: 預估結束
      }
      if (update.realEndTime !== undefined) {
        const real = parseTimeStringToDateObject(update.realEndTime);
        sheet.getRange(row, 14).setValue(real); // N: 實際結束
        const flag = update.realEndTime ? 1 : '';
        sheet.getRange(row, 15).setValue(flag); // O: 排程已結束
      }
    }
  });
}


/**
 * ✅ 時間字串 → Date（用於寫入 Sheet）
 */
function parseTimeStringToDateObject(str) {
  Logger.log(str)
  if (!str || !str.includes(':')) return '';
  const [hh, mm] = str.split(':').map(Number);
  const d = new Date(1899, 11, 30); // 固定 base date
  d.setHours(hh, mm, 0, 0);         // 清秒與毫秒
  return d;
}


function getNextOrderIndex(date, line) {
  const sheet = ss.getSheetByName('日排程整理');
  const data = sheet.getDataRange().getValues();
  let maxOrder = 0;

  for (let i = 1; i < data.length; i++) {
    const rowDate = Utilities.formatDate(new Date(data[i][0]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const rowLine = data[i][1];
    const orderVal = parseInt(data[i][10], 10); // K欄為排序值
    if (rowDate === date && rowLine === line && !isNaN(orderVal)) {
      maxOrder = Math.max(maxOrder, orderVal);
    }
  }
  return maxOrder + 1;
}


/**
 * 切換指定排程的 slot1（P欄）或 slot2（Q欄）
 * @param {string} orderId
 * @param {number} slot 1=展示1, 2=展示2
 * @return {'set'|'cancel'} 回傳本次操作是「設定」還是「取消」
 */
function markScheduleSlot(orderId, slot) {
  const sheet = ss.getSheetByName('日排程整理');
  const data  = sheet.getDataRange().getValues();

  // 對應欄位與 flag index
  const col      = slot === 1 ? 16 : 17;  // P 或 Q
  const flagIdx  = slot === 1 ? 15 : 16;  // data[i][15] 或 data[i][16]

  for (let i = 1; i < data.length; i++) {
    if (data[i][9] === orderId) {  // 找到對應 orderId
      const rowDate = Utilities.formatDate(new Date(data[i][0]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      const line    = data[i][1];

      // 如果該欄已經是 1，就代表要「取消」
      if (data[i][flagIdx] === 1) {
        sheet.getRange(i + 1, col).clearContent();
        return 'cancel';
      }

      // 否則要「設定」：先清除同日同線的所有同欄位
      for (let j = 1; j < data.length; j++) {
        const jd = Utilities.formatDate(new Date(data[j][0]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
        if (data[j][1] === line && jd === rowDate) {
          sheet.getRange(j + 1, col).clearContent();
        }
      }
      // 再把當前這筆設為 1
      sheet.getRange(i + 1, col).setValue(1);
      return 'set';
    }
  }
  throw new Error('❌ 找不到指定單號：' + orderId);
}

/**
 * 回傳今日展示資料（slot1/slot2）
 */
function getTodayDisplayData() {
  const sheet = ss.getSheetByName('日排程整理');
  const data = sheet.getDataRange().getValues();
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const result = [];

  for (let i = 1; i < data.length; i++) {
    const rowDate = Utilities.formatDate(new Date(data[i][0]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const slot1 = data[i][15]; // P
    const slot2 = data[i][16]; // Q

    if (rowDate === today && (slot1 === 1 || slot2 === 1)) {
      result.push({
        line: data[i][1],
        channel: data[i][2],
        item: data[i][3],
        people: data[i][4],
        newguy: data[i][5],
        pieces: data[i][6],
        workhours: parseFloat(data[i][7]),
        note: data[i][8],
        orderid: data[i][9],
        startTime: formatTimeStringRounded(data[i][11]),
        estEndTime: formatTimeStringRounded(data[i][12]),
        slot: slot1 === 1 ? 1 : 2
      });
    }
  }

  return result;
}


function formatDate(d) {
  return Utilities.formatDate(new Date(d), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}


const sheet2 = ss.getSheetByName('工時計算'); // 分頁名稱
const datapeople = sheet2.getRange('G:U').getValues();// 取得所有資料 (G 到 T 欄)

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
    .getContent();
}

// ALL html 路由器，切換頁面用
function render(file, argsObject) {
  var tmp = HtmlService.createTemplateFromFile(file);
  
  if (argsObject) {
    var keys = Object.keys(argsObject);

    keys.forEach(function (key) {
      tmp[key] = argsObject[key];
    });
  }//End if
  return tmp.evaluate()
    // .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL) //How to remove Warning "This application was created by ....
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

//page1.html 選擇通路，並自動拉出品項
function getOrderCalculator() {
  try {
    // 取得所有資料，包含通路 (A 欄) 和品項 (G 欄)
    const data = sheet2.getRange('A:T').getValues();

    // 移除標題列
    const dataWithoutHeader = data.slice(1);

    // 建立通路與品項的對應關係
    const channelItemMap = new Map();

    dataWithoutHeader.forEach(row => {
      const channel = row[0]; // 通路
      const item = row[6];   // 品項

      if (channel && item) { // 確保通路和品項都有值
        if (!channelItemMap.has(channel)) {
          channelItemMap.set(channel, []);
        }
        channelItemMap.get(channel).push(item);
      }
    });

    //去除品項重複值
    for (let [key, value] of channelItemMap) {
      channelItemMap.set(key, [...new Set(value)]);
    }


    
    return {
      channels: [...channelItemMap.keys()], // 不重複的通路
      channelItems: Object.fromEntries(channelItemMap) // 通路與品項的對應關係
      
    };
  } catch (error) {
    Logger.log(error);
    return { channels: [], channelItems: {} };
  }
}

// page1.html 選擇通品項後，自動選擇可用人數
function getOrderpeople(selectedItem) {
  try {
     // 移除標題列
    const dataWithoutHeader = datapeople.slice(1);

    // 尋找選定品項的資料列
    const selectedRow = dataWithoutHeader.find(row => row[0] === selectedItem);


    if (selectedRow) {
      const peoplenumeff = []; //效率
      const peoplenum = [];  //人數
      const perbox = [];



      for (let i = 4; i <= 13; i++) {
        const efficiency = selectedRow[i];
        const perboxdetail = selectedRow[14];
        if (efficiency) {
          peoplenumeff.push(efficiency);
          peoplenum.push(i-3);
          perbox.push(perboxdetail);

        }
      }
      return { peoplenumeff, peoplenum, perbox };
    } 
  }catch (error) {
    Logger.log(error);
    return { peoplenumeff: [], peoplenum: [],perbox:[] }; // 發生錯誤時回傳空陣列
  }
}