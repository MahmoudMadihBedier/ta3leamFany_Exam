// NOTE: paste this into your Google Apps Script project (replace your current doGet/doPost or merge).
const RESULTS_SHEET = 'ExamResults';
const QUESTIONS_SHEET = 'ExamQuestions';
const scriptProp = PropertiesService.getScriptProperties();

function setup() {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  scriptProp.setProperty('key', activeSpreadsheet.getId());
}

// Robust helper to read body (supports e.parameter.data, e.postData.contents, direct params)
function _readPayload(e) {
  if (!e) return null;
  if (e.parameter && e.parameter.data) {
    try { return JSON.parse(e.parameter.data); } catch (err) { return null; }
  }
  if (e.postData && e.postData.contents) {
    const t = (e.postData.type || '').toLowerCase();
    if (t.indexOf('application/json') !== -1) {
      try { return JSON.parse(e.postData.contents); } catch (err) { return null; }
    } else {
      // parse form encoded body
      const parsed = {};
      e.postData.contents.split('&').forEach(pair => {
        const parts = pair.split('=');
        const k = decodeURIComponent(parts[0]||'');
        const v = decodeURIComponent((parts.slice(1).join('='))||'');
        parsed[k] = v;
      });
      if (parsed.data) {
        try { return JSON.parse(parsed.data); } catch (err) { return null; }
      }
      return parsed;
    }
  }
  if (e.parameter && Object.keys(e.parameter).length) return e.parameter;
  return null;
}

// Append a row to a sheet by header order
function _appendToSheet(sheetName, obj) {
  const doc = SpreadsheetApp.openById(scriptProp.getProperty('key'));
  const sheet = doc.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => {
    if (!h) return '';
    if (h === 'Timestamp') {
      return obj.Timestamp ? new Date(obj.Timestamp) : new Date();
    }
    return obj.hasOwnProperty(h) ? obj[h] : (obj[h.replace(/\s+/g,'')] || obj[h.toLowerCase()] || '');
  });
  sheet.appendRow(row);
  return { result: 'success', data: row };
}

// Read questions sheet and return array of objects (headers => fields)
function _readSheetAsObjects(sheetName) {
  const doc = SpreadsheetApp.openById(scriptProp.getProperty('key'));
  const sheet = doc.getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return [];
  const headers = values[0];
  const rows = values.slice(1);
  return rows.map(r => {
    const obj = {};
    headers.forEach((h, i) => {
      if (!h) return;
      obj[h] = r[i];
    });
    return obj;
  });
}

function doPost(e) {
  const payload = _readPayload(e);
  if (!payload) {
    return ContentService.createTextOutput(JSON.stringify({ status:'error', message:'No payload' })).setMimeType(ContentService.MimeType.JSON);
  }

  const action = payload.action || payload._action || 'submitResult';

  try {
    if (action === 'addQuestion') {
      // Expect payload.question object
      const q = payload.question;
      if (!q) throw new Error('Missing question object');
      // open questions sheet, ensure headers exist
      const doc = SpreadsheetApp.openById(scriptProp.getProperty('key'));
      let sheet = doc.getSheetByName(QUESTIONS_SHEET);
      if (!sheet) {
        sheet = doc.insertSheet(QUESTIONS_SHEET);
        // headers: id,type,subject,question,options,correctAnswer,createdAt
        sheet.appendRow(['id','type','subject','question','options','correctAnswer','createdAt']);
      }
      // prepare row values (options stored as JSON string)
      const rowObj = {
        id: q.id,
        type: q.type,
        subject: q.subject,
        question: q.question,
        options: q.options ? JSON.stringify(q.options) : '',
        correctAnswer: q.correctAnswer,
        createdAt: new Date()
      };
      const res = _appendToSheet(QUESTIONS_SHEET, rowObj);
      return ContentService.createTextOutput(JSON.stringify({ status:'success', action:'addQuestion', row: res.data })).setMimeType(ContentService.MimeType.JSON);
    } else {
      // default: treat as exam result submission — append to RESULTS_SHEET
      const res = _appendToSheet(RESULTS_SHEET, payload);
      return ContentService.createTextOutput(JSON.stringify({ status:'success', action:'submitResult', row: res.data })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status:'error', message: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const action = params.action || params._action || 'ping';

  try {
    if (action === 'getQuestions') {
      const rows = _readSheetAsObjects(QUESTIONS_SHEET);
      // parse options JSON back to arrays and convert ids to number
      const parsed = rows.map(r => ({
        id: Number(r.id) || null,
        type: r.type || '',
        subject: r.subject || '',
        question: r.question || '',
        options: r.options ? ( (()=>{ try{return JSON.parse(r.options);} catch(e){return String(r.options).split('|').map(s=>s.trim()).filter(Boolean);} })() ) : null,
        correctAnswer: (function(){ try { return (typeof r.correctAnswer === 'string' && r.correctAnswer.match(/^(true|false)$/i)) ? (/^true$/i.test(r.correctAnswer)) : (isNaN(Number(r.correctAnswer)) ? r.correctAnswer : Number(r.correctAnswer)); } catch(e){ return r.correctAnswer; } })()
      }));
      return ContentService.createTextOutput(JSON.stringify({ status:'success', questions: parsed })).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === 'getResults') {
      const rows = _readSheetAsObjects(RESULTS_SHEET);
      // Normalize to simple objects and stringify Dates
      const parsed = rows.map(r => {
        const obj = {};
        Object.keys(r).forEach(k => {
          let v = r[k];
          if (v instanceof Date) v = v.toISOString();
          obj[k] = v;
        });
        return obj;
      });
      return ContentService.createTextOutput(JSON.stringify({ status:'success', results: parsed })).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ status:'ok', message:'use action=getQuestions|getResults or POST action=addQuestion' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status:'error', message:err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}