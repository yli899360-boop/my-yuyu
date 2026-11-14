var ZODIAC = {
    '马': [1,13,25,37,49],
    '蛇': [2,14,26,38],
    '龙': [3,15,27,39],
    '兔': [4,16,28,40],
    '虎': [5,17,29,41],
    '牛': [6,18,30,42],
    '鼠': [7,19,31,43],
    '猪': [8,20,32,44],
    '狗': [9,21,33,45],
    '鸡': [10,22,34,46],
    '猴': [11,23,35,47],
    '羊': [12,24,36,48]
};
var RED = [1,2,7,8,12,13,18,19,23,24,29,30,34,35,40,45,46];
var BLUE = [3,4,9,10,14,15,20,25,26,31,36,37,41,42,47,48];
var GREEN = [5,6,11,16,17,21,22,27,28,32,33,38,39,43,44,49];
var CN_NUM = {'零':0,'〇':0,'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10};
var K_CN = {'2':'二','3':'三','4':'四','5':'五'};

function chineseToNumber(str){
    if (!str) return null;
    str = String(str).trim();
    if (/^\d+(\.\d+)?$/.test(str)) return parseFloat(str);
    var match = str.match(/([一二三四五六七八九两]?)十([一二三四五六七八九]?)/);
    if (match) {
        var tens = match[1] ? (CN_NUM[match[1]] || 1) : 1;
        var ones = match[2] ? (CN_NUM[match[2]] || 0) : 0;
        return tens * 10 + ones;
    }
    if (CN_NUM[str] !== undefined) return CN_NUM[str];
    var temp = str;
    for (var key in CN_NUM) {
        if (Object.prototype.hasOwnProperty.call(CN_NUM, key)) temp = temp.split(key).join(CN_NUM[key]);
    }
    var n = parseFloat(temp);
    if (isNaN(n)) return null;
    return n;
}

function pad(n){ return n < 10 ? '0' + n : '' + n; }

function C(n, k){
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    k = Math.min(k, n - k);
    var r = 1;
    for (var i = 0; i < k; i++) {
        r = r * (n - i) / (i + 1);
    }
    return Math.round(r);
}

function extractNumsInOrder(str){
    var matches = str.match(/\d{1,2}/g) || [];
    return Array.from(new Set(matches.map(Number))).filter(function(n){ return n >= 1 && n <= 49; });
}

function extractZodiacsInOrder(str){
    var found = [];
    var regex = /鼠|牛|虎|兔|龙|蛇|马|羊|猴|鸡|狗|猪/g;
    var m;
    while ((m = regex.exec(str)) !== null) {
        found.push(m[0]);
    }
    return found;
}

function extractNumsKeepDup(str){
    var matches = str.match(/\d{1,2}/g) || [];
    return matches.map(Number).filter(function(n){ return n >= 1 && n <= 49; });
}

function parseAmountCN(str){
    if (!str) return null;
    str = String(str).trim();
    if (/^\d+(\.\d+)?$/.test(str)) return parseFloat(str);
    var baiMap = { '一':100, '二':200, '两':200, '三':300, '四':400, '五':500, '六':600, '七':700, '八':800, '九':900 };
    var bm = str.match(/^([一二两三四五六七八九])百$/);
    if (bm) return baiMap[bm[1]];
    if (str === '一千' || str === '千') return 1000;
    return chineseToNumber(str);
}

function getBeijingTimeString(){
    var d = new Date();
    var bt = new Date(d.getTime() + (d.getTimezoneOffset() + 480) * 60000);
    var year = bt.getFullYear();
    var month = pad(bt.getMonth() + 1);
    var date = pad(bt.getDate());
    var hours = pad(bt.getHours());
    var minutes = pad(bt.getMinutes());
    var seconds = pad(bt.getSeconds());
    var wd = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][bt.getDay()];
    return year + '-' + month + '-' + date + ' ' + hours + ':' + minutes + ':' + seconds + ' (' + wd + ')';
}

function extractBracketPairs(str){
    var pairs = [];
    var re = /【\s*(\d{1,2})\s*[-–—.，,、\s]\s*(\d{1,2})\s*】/g;
    var m;
    while ((m = re.exec(str)) !== null) {
        var a = parseInt(m[1], 10);
        var b = parseInt(m[2], 10);
        if (a >= 1 && a <= 49 && b >= 1 && b <= 49) pairs.push([a, b]);
    }
    return pairs;
}

function extractBracketTriplets(str){
    var triplets = [];
    var re = /【\s*(\d{1,2})\s*[-–—.，,、\s]\s*(\d{1,2})\s*[-–—.，,、\s]\s*(\d{1,2})\s*】/g;
    var m;
    while ((m = re.exec(str)) !== null) {
        var a = parseInt(m[1], 10);
        var b = parseInt(m[2], 10);
        var c = parseInt(m[3], 10);
        if (a >= 1 && a <= 49 && b >= 1 && b <= 49 && c >= 1 && c <= 49) triplets.push([a, b, c]);
    }
    return triplets;
}

var historyData = [];

document.getElementById("commandInput").addEventListener("keydown", function(e){
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        calculate();
    }
});

function htmlToText(html){
    var div = document.createElement('div');
    div.innerHTML = html;
    var t = div.textContent || div.innerText || '';
    return t.replace(/\u00a0/g, ' ');
}

document.getElementById("commandInput").addEventListener("paste", function(e){
    var dt = e.clipboardData;
    if (!dt || !dt.items || dt.items.length === 0) return;
    var textIdx = [];
    var htmlIdx = [];
    for (var pi = 0; pi < dt.items.length; pi++) {
        if (dt.items[pi].type === 'text/plain') textIdx.push(pi);
        else if (dt.items[pi].type === 'text/html') htmlIdx.push(pi);
    }
    /* 原有逻辑：多个纯文本对象 → 全部拼接 */
    if (textIdx.length > 1) {
        e.preventDefault();
        var target = e.target;
        var curVal = target.value || '';
        var results = {};
        var pending = textIdx.length;
        textIdx.forEach(function(idx){
            dt.items[idx].getAsString(function(s){
                results[idx] = s || '';
                pending--;
                if (pending === 0) {
                    var merged = [];
                    for (var m = 0; m < dt.items.length; m++) {
                        if (results[m] !== undefined) merged.push(results[m]);
                    }
                    var all = merged.join('\n');
                    target.value = curVal + all;
                    showPasteTip(all);
                }
            });
        });
        return;
    }
    /* 新增：纯文本对象 ≤1 但有富文本对象时（微信多选复制常见），对比行数取更完整的一份 */
    if (textIdx.length === 1 && htmlIdx.length >= 1) {
        e.preventDefault();
        var target2 = e.target;
        var curVal2 = target2.value || '';
        var pt = '';
        var ht = '';
        var done2 = 0;
        function pickBest(){
            done2++;
            if (done2 < 2) return;
            var ptLines = pt.split(/[\n\r]+/).filter(function(s){ return s.trim(); }).length;
            var htLines = ht.split(/[\n\r]+/).filter(function(s){ return s.trim(); }).length;
            var best = htLines > ptLines ? ht : pt;
            target2.value = curVal2 + best;
            showPasteTip(best);
        }
        dt.items[textIdx[0]].getAsString(function(s){ pt = s || ''; pickBest(); });
        dt.items[htmlIdx[0]].getAsString(function(s){ ht = htmlToText(s || ''); pickBest(); });
        return;
    }
    /* 单个纯文本对象（无富文本）交给浏览器默认粘贴 */
});

async function pasteFromClipboard(){
    var inputEl = document.getElementById("commandInput");
    inputEl.focus();
    try {
        if (navigator.clipboard && navigator.clipboard.read) {
            var items = await navigator.clipboard.read();
            if (items && items.length > 0) {
                var parts = [];
                for (var i = 0; i < items.length; i++) {
                    var got = '';
                    try {
                        var blob = await items[i].getType('text/plain');
                        got = await blob.text();
                    } catch (e) { /* 无纯文本，尝试富文本 */ }
                    if (!got || !got.trim()) {
                        try {
                            var hblob = await items[i].getType('text/html');
                            got = htmlToText(await hblob.text());
                        } catch (e2) { /* 该对象无文本，跳过 */ }
                    }
                    if (got && got.trim()) parts.push(got);
                }
                if (parts.length > 0) {
                    var merged = parts.join('\n');
                    inputEl.value = merged;
                    showPasteTip(merged);
                    return;
                }
            }
        }
    } catch (err) { /* read() 失败/无权限，走下方备用 */ }
    try {
        if (navigator.clipboard && navigator.clipboard.readText) {
            var text = await navigator.clipboard.readText();
            if (text) {
                inputEl.value = text;
                showPasteTip(text);
                return;
            }
        }
        var success = document.execCommand('paste');
        if (!success && !inputEl.value) inputEl.select();
    } catch (err2) {
        inputEl.select();
    }
}

function showClearConfirm(){
    if (historyData.length === 0) return;
    document.getElementById("customModal").classList.add("show");
}

function closeModal(){
    document.getElementById("customModal").classList.remove("show");
}

function confirmClearAll(){
    closeModal();
    historyData = [];
    document.getElementById("commandInput").value = "";
    document.getElementById("errorTip").style.display = 'none';
    document.getElementById("copySuccess").style.display = 'none';
    renderHistory();
}

function tryMultiSplit(text){
    if (/[；;]/.test(text)) {
        var parts = text.split(/[；;]/).map(function(s){ return s.trim(); }).filter(Boolean);
        if (parts.length > 1) return parts;
    }
    var lines = text.split(/[\n\r]+/).map(function(l){ return l.trim(); }).filter(Boolean);
    if (lines.length > 1) {
        var isMultiGroup = lines.some(function(l){ return /各组|每组/.test(l); });
        if (!isMultiGroup) {
            var allIndep = lines.every(function(l){
                if (/【/.test(l)) return false;
                var hasType = /二中二|2中2|三中三|3中3|三中二|四全中|二连|三连|四连|五连|平特|特码|特碼|正码|尾数|半波|[0-4]头/.test(l);
                var hasZodiacBet = /[鼠牛虎兔龙蛇马羊猴鸡狗猪]/.test(l) && /(?:各|个|每个|每|压|组)\s*[\d一二三四五六七八九十]+/.test(l);
                var hasNumBet = /\d{1,2}/.test(l) && /(?:各|个|每个|每|压|组)\s*[\d一二三四五六七八九十]+/.test(l);
                return hasType || hasZodiacBet || hasNumBet;
            });
            if (allIndep) return lines;
        }
    }
    var parenMatches = text.match(/[（(][^）)]*[）)]/g);
    if (parenMatches && parenMatches.length > 1) {
        var inner = parenMatches.map(function(p){ return p.replace(/^[（(]/, '').replace(/[）)]$/, '').trim(); });
        return inner;
    }
    var groupCount = (text.match(/一组|各组/g) || []).length;
    if (groupCount >= 2 && /\s{2,}/.test(text)) {
        var parts2 = text.split(/\s{2,}/).filter(Boolean);
        if (parts2.length > 1) return parts2;
    }
    return null;
}

function tryParseErZhongEr(text){
    if (!/二中二|2中2/.test(text)) return null;
    var unit = 5;
    var numText = text;
    var amountMatch = text.match(/(?:各|每|每个|个|x|X|=|\*|\/)?\s*(?:号|个|数|米|块|元)?\s*([一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱)?$/);
    if (amountMatch) {
        var a = chineseToNumber(amountMatch[1]);
        if (a !== null) unit = a;
        numText = text.substring(0, amountMatch.index);
    }
    var bracketPairs = extractBracketPairs(numText);
    if (bracketPairs.length > 0) {
        return {
            type: '二中二',
            count: bracketPairs.length,
            detail: bracketPairs.map(function(p){ return pad(p[0]) + '-' + pad(p[1]); }).join(' ') + ' (共' + bracketPairs.length + '组)',
            unit: unit,
            subtotal: bracketPairs.length * unit
        };
    }
    var nums = extractNumsInOrder(numText);
    if (nums.length < 2) return null;
    if (text.indexOf("复式") !== -1 || nums.length % 2 !== 0) {
        var count = C(nums.length, 2);
        return {
            type: '二中二',
            count: count,
            detail: nums.map(pad).join(' ') + ' (' + nums.length + '个号复式=' + count + '组)',
            unit: unit,
            subtotal: count * unit
        };
    } else {
        var pairs = [];
        for (var i = 0; i + 1 < nums.length; i += 2) {
            pairs.push([nums[i], nums[i + 1]]);
        }
        var detail = pairs.map(function(p){ return pad(p[0]) + '-' + pad(p[1]); }).join(' ');
        return {
            type: '二中二',
            count: pairs.length,
            detail: detail + ' (共' + pairs.length + '组)',
            unit: unit,
            subtotal: pairs.length * unit
        };
    }
}

function tryParseSanZhongSanDirect(text){
    if (!/三中三|3中3/.test(text)) return null;
    var unit = 5;
    var cleanText = text.replace(/三中三|3中3/g, ' ');
    var amountMatch = cleanText.match(/(?:各|每|每个|个|x|X|=|\*|\/)?\s*(?:号|个|数|米|块|元)?\s*([一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱)?$/);
    if (amountMatch) {
        var a = parseAmountCN(amountMatch[1]);
        if (a !== null) unit = a;
        cleanText = cleanText.substring(0, amountMatch.index);
    }
    var numText = cleanText;
    var bracketTriplets = extractBracketTriplets(numText);
    if (bracketTriplets.length > 0) {
        return {
            type: '三中三',
            count: bracketTriplets.length,
            detail: bracketTriplets.map(function(p){ return pad(p[0]) + '-' + pad(p[1]) + '-' + pad(p[2]); }).join(' ') + ' (共' + bracketTriplets.length + '组)',
            unit: unit,
            subtotal: bracketTriplets.length * unit
        };
    }
    var nums = extractNumsInOrder(numText);
    if (nums.length < 3) return null;
    if (text.indexOf("复式") !== -1 || nums.length % 3 !== 0) {
        var count = C(nums.length, 3);
        return {
            type: '三中三',
            count: count,
            detail: nums.map(pad).join(' ') + ' (' + nums.length + '个号复式=' + count + '组)',
            unit: unit,
            subtotal: count * unit
        };
    } else {
        var triplets = [];
        for (var i = 0; i + 2 < nums.length; i += 3) {
            triplets.push([nums[i], nums[i + 1], nums[i + 2]]);
        }
        var detail = triplets.map(function(t){ return pad(t[0]) + '-' + pad(t[1]) + '-' + pad(t[2]); }).join(' ');
        return {
            type: '三中三',
            count: triplets.length,
            detail: detail + ' (共' + triplets.length + '组)',
            unit: unit,
            subtotal: triplets.length * unit
        };
    }
}

function tryParsePingAndLian(line){
    if (line.indexOf("平特") !== -1) {
        var am = line.match(/([一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱)?$/);
        if (am) {
            var amount = chineseToNumber(am[1]);
            var before = line.substring(0, am.index).trim();
            var tm = before.match(/^(平特(?:[一二三四五六2-6]肖)?)/);
            var tagType = tm ? tm[1] : '平特一肖';
            var rawDetail = before.replace(/^(平特(?:[一二三四五六2-6]肖)?)/, '').replace(/(各|每|每个|个|号|数)+$/g, '').trim();
            if (amount !== null && rawDetail) {
                return { type: tagType, count: 1, detail: rawDetail, unit: amount, subtotal: amount };
            }
        }
    }
    var m = line.match(/^([二三四五2-5])\s*(?:肖)?\s*连\s*([鼠牛虎兔龙蛇马羊猴鸡狗猪]+)\s*([一二三四五六七八九十两零〇\d]+)/);
    if (m) {
        var km = { '二':2, '2':2, '三':3, '3':3, '四':4, '4':4, '五':5, '5':5 };
        var k = km[m[1]] || 2;
        var zs = extractZodiacsInOrder(m[2]);
        var amt = chineseToNumber(m[3]);
        if (zs.length >= k && amt !== null) {
            var count = C(zs.length, k);
            return { type: '平特' + (K_CN[String(k)] || '') + '连肖', count: count, detail: m[2] + (count > 1 ? ' (' + zs.length + '选' + k + '=' + count + '注)' : ''), unit: amt, subtotal: count * amt };
        }
    }
    return null;
}

// 新增：斜杠分隔多组三中三，如"门三中三16-40-36/13-25-20/.../各5"
function tryParseSlashSanZhongSan(text){
    if (!/三中三|3中3/.test(text)) return null;
    if (!text.includes('/')) return null;
    if (/[鼠牛虎兔龙蛇马羊猴鸡狗猪]/.test(text)) return null;
    // 提取金额
    var unit = 5;
    var amtM = text.match(/([一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?\s*$/);
    if (amtM) unit = parseAmountCN(amtM[1]);
    // 去掉玩法词和金额
    var rest = text.replace(/门?三中三|3中3/g, '').replace(amtM ? amtM[0] : '', '');
    // 按斜杠分组
    var groups = rest.split('/').map(function(g){ return g.trim(); }).filter(function(g){
        return /\d/.test(g);
    });
    var items = [];
    groups.forEach(function(g){
        var nums = g.match(/\d+/g);
        if (nums && nums.length === 3) {
            items.push({ type: '三中三', count: 1, detail: nums.map(function(n){return n.padStart(2,'0');}).join('-'), unit: unit, subtotal: unit });
        }
    });
    if (items.length >= 2) return { _multi: true, items: items };
    return null;
}
function tryParseMultiSanZhongSan(text){
    if (!/三中三|3中3/.test(text)) return null;
    if (/[鼠牛虎兔龙蛇马羊猴鸡狗猪]/.test(text)) return null;
    if (!/[\n。]|\s{2,}/.test(text)) return null;
    var unit = null;
    var amtFull = null;
    var amtM = text.match(/(?:各组|每组各|各|每个|每)\s*([一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱)?/);
    if (amtM) {
        unit = parseAmountCN(amtM[1]);
        amtFull = amtM[0];
    }
    if (unit === null) {
        var endM = text.match(/((?:[一二两三四五六七八九][百千]?)|[一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱)?\s*$/);
        if (endM) {
            unit = parseAmountCN(endM[1]);
            amtFull = endM[0];
        }
    }
    if (unit === null) return null;
    var rest = text.replace(/三中三|3中3/g, '').replace(/各组|每组各|每个|每/g, '');
    if (amtFull) rest = rest.replace(amtFull, '');
    var allNums = extractNumsKeepDup(rest);
    var groups = [];
    for (var i = 0; i + 2 < allNums.length; i += 3) {
        groups.push([allNums[i], allNums[i+1], allNums[i+2]]);
    }
    if (groups.length === 0) return null;
    var detail = groups.map(function(g){ return g.map(pad).join('-'); }).join(' ');
    return { type: '三中三', count: groups.length, detail: detail + ' (共' + groups.length + '组)', unit: unit, subtotal: groups.length * unit };
}

// 三中三逗号分组：三中三，17-27-33，9-29-14，各组20文
function tryParseCommaSZS(text){
    if (!/三中三|3中3/.test(text)) return null;
    if (/[鼠牛虎兔龙蛇马羊猴鸡狗猪]/.test(text)) return null;
    if (!text.match(/[，,]/)) return null;
    if (/\n/.test(text)) return null;
    if (/\//.test(text)) return null;
    if (/二中二|二中特|特串|三中二|四全中|连肖|平特|尾数|半波|头|正码/.test(text)) return null;
    var cleaned = text.replace(/三中三|3中3/g, ' ').replace(/^(奥特|新澳|新澳门|澳门|新奥|香港|香|澳|奥|澳特)\s*/, '').trim();
    var unit = 5;
    var amtM = cleaned.match(/(?:各组|每组各|每组|各|每个|每)\s*([一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?/);
    if (amtM) {
        unit = parseAmountCN(amtM[1]);
        cleaned = cleaned.replace(amtM[0], ' ');
    }
    var parts = cleaned.split(/[，,]/).map(function(p){ return p.trim(); }).filter(function(p){ return p.length > 0; });
    var groups = [];
    parts.forEach(function(p){
        var nums = p.match(/\d{1,2}/g);
        if (nums && nums.length >= 3) {
            for (var i = 0; i + 2 < nums.length; i += 3) {
                groups.push([parseInt(nums[i]), parseInt(nums[i+1]), parseInt(nums[i+2])]);
            }
        }
    });
    if (groups.length === 0) return null;
    return { type: '三中三', count: groups.length, detail: groups.map(function(g){ return g.map(pad).join('-'); }).join(' ') + ' (共' + groups.length + '组)', unit: unit, subtotal: groups.length * unit };
}

// 三中二：【32 13 16】【42 04 45】...三中二各150
function tryParseSanZhongEr(text){
    if (!/三中二|3中2/.test(text)) return null;
    if (/[鼠牛虎兔龙蛇马羊猴鸡狗猪]/.test(text)) return null;
    var cleaned = text.replace(/三中二|3中2/g, ' ').replace(/^(奥特|新澳|新澳门|澳门|新奥|香港|香|澳|奥|澳特)\s*/, '').trim();
    var unit = 5;
    var amtM = cleaned.match(/(?:各组|每组各|每组|各|每个|每)\s*([一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?/);
    if (amtM) {
        unit = parseAmountCN(amtM[1]);
        cleaned = cleaned.replace(amtM[0], ' ');
    }
    // 括号分组
    var bracketGroups = cleaned.match(/[【\[（(]([^】\]）)]+)[】\]）)]/g);
    if (bracketGroups && bracketGroups.length > 0) {
        var groups = [];
        bracketGroups.forEach(function(bg){
            var nums = bg.match(/\d{1,2}/g);
            if (nums && nums.length >= 3) groups.push(nums.map(Number));
        });
        if (groups.length > 0) {
            var details = [];
            groups.forEach(function(g){
                details.push(g.map(pad).join('-'));
            });
            return { type: '三中二', count: groups.length, detail: details.join(' ') + ' (共' + groups.length + '组)', unit: unit, subtotal: groups.length * unit };
        }
    }
    // 逗号或空格分组
    var parts = cleaned.split(/[，,]/).map(function(p){ return p.trim(); }).filter(function(p){ return p.length > 0; });
    if (parts.length > 1) {
        var g2 = [];
        parts.forEach(function(p){
            var nums = p.match(/\d{1,2}/g);
            if (nums && nums.length >= 2) g2.push(nums.map(Number));
        });
        if (g2.length > 0) {
            var details2 = [];
            g2.forEach(function(g){
                details2.push(g.map(pad).join('-'));
            });
            return { type: '三中二', count: g2.length, detail: details2.join(' ') + ' (共' + g2.length + '组)', unit: unit, subtotal: g2.length * unit };
        }
    }
    return null;
}

function tryParseErZhongErSmart(text){
    if (!/二中二|2中2/.test(text)) return null;
    if (/复式/.test(text)) return null;
    var cleaned = text.replace(/二中二|2中2/g, '');
    var unit = 5;
    var amtM = cleaned.match(/([一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱)?\s*$/);
    if (amtM) {
        unit = parseAmountCN(amtM[1]);
        cleaned = cleaned.substring(0, amtM.index);
    }
    cleaned = cleaned.replace(/^(澳门|新澳|香港|奥特)\s*/, '').trim();
    var bracketPairs = extractBracketPairs(cleaned);
    if (bracketPairs.length > 0) {
        return {
            type: '二中二',
            count: bracketPairs.length,
            detail: bracketPairs.map(function(p){ return pad(p[0]) + '-' + pad(p[1]); }).join(' ') + ' (共' + bracketPairs.length + '组)',
            unit: unit,
            subtotal: bracketPairs.length * unit
        };
    }
    var nums = extractNumsInOrder(cleaned);
    if (nums.length < 2) return null;
    if (nums.length % 2 === 0) {
        var pairs = [];
        for (var i = 0; i + 1 < nums.length; i += 2) pairs.push([nums[i], nums[i+1]]);
        return { type: '二中二', count: pairs.length, detail: pairs.map(function(p){ return pad(p[0]) + '-' + pad(p[1]); }).join(' ') + ' (共' + pairs.length + '组)', unit: unit, subtotal: pairs.length * unit };
    }
    var cnt = C(nums.length, 2);
    return { type: '二中二', count: cnt, detail: nums.map(pad).join(' ') + ' (' + nums.length + '个号复式=' + cnt + '组)', unit: unit, subtotal: cnt * unit };
}

function tryParseLianXiaoReverse(line){
    var normalized = line
        .replace(/联/g, '连')
        .replace(/复试/g, '复式')
        .replace(/复式\s*([二三四五2-5])\s*肖/g, '复式$1连肖')
        .replace(/平特([二三四五2-5])肖/g, '$1连肖')
        .replace(/平特([二三四五2-5])连/g, '$1连肖')
        .replace(/^(奥|澳|新奥|新澳|澳特|奥特|澳门)\s*/, '');
    line = normalized;
    var m = line.match(/([二三四五2-5])\s*连\s*肖?/);
    var k, kCn;
    if (!m) {
        // 无数字前缀：如"蛇牛鼠鸡连肖50"，按生肖个数推断k
        if (/连肖|连/.test(line)) {
            var zsGuess = extractZodiacsInOrder(line);
            if (zsGuess.length >= 2 && zsGuess.length <= 5) {
                k = zsGuess.length;
                kCn = K_CN[String(k)] || '';
            } else {
                return null;
            }
        } else {
            return null;
        }
    } else {
        var kMap = { '二':2, '2':2, '三':3, '3':3, '四':4, '4':4, '五':5, '5':5 };
        k = kMap[m[1]];
        kCn = K_CN[String(k)] || '';
    }
    var isFuShi = /复式/.test(line);
    var amtRe = /((?:[一二两三四五六七八九][百千])|[一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?/;
    var amtEndRe = new RegExp(amtRe.source + '\\s*$');
    var rest = line
        .replace(/新澳|澳门|香港|奥特|奥|澳|新奥|澳特/g, '')
        .replace(/复式/g, '')
        .replace(/[二三四五2-5]\s*连\s*肖?/g, '')
        .replace(/各组|一组/g, '')
        .replace(/共\s*[一二三四五六七八九十两零〇\d]+\s*(?:米|块|元|块钱)?/g, ' ')
        .replace(/[，,。；;]/g, ' ')
        .replace(/平特/g, '')
        .trim();
    if (isFuShi) {
        var unit = null;
        var endM = rest.match(amtEndRe);
        if (endM) {
            unit = parseAmountCN(endM[1]);
            rest = rest.substring(0, endM.index);
        }
        var allZs = extractZodiacsInOrder(rest);
        if (allZs.length < k || unit === null) return null;
        var cnt = C(allZs.length, k);
        return { type: '复式' + k + '肖连', count: cnt, detail: allZs.join('') + ' (' + allZs.length + '选' + k + '=' + cnt + '注)', unit: unit, subtotal: cnt * unit };
    }
    if (rest.indexOf('-') !== -1 || rest.indexOf('~') !== -1) {
        var unit2 = null;
        var endM2 = rest.match(amtEndRe);
        if (endM2) {
            unit2 = parseAmountCN(endM2[1]);
            rest = rest.substring(0, endM2.index).trim();
        }
        var groups = [];
        var segs = rest.split(/[-~]+/);
        for (var si = 0; si < segs.length; si++) {
            var seg = segs[si].trim();
            if (!seg) continue;
            var parts = seg.split(/\s+/);
            for (var pi = 0; pi < parts.length; pi++) {
                var part = parts[pi].trim();
                if (part) groups.push(part);
            }
        }
        var tc = 0;
        var ta = 0;
        var dp = [];
        // 如果每组只有1个生肖且总数=k，合并成一组（如"兔-龙"二连肖）
        var allSingle = groups.every(function(g){ return extractZodiacsInOrder(g).length === 1; });
        if (allSingle && groups.length === k) {
            var mergedZs = [];
            groups.forEach(function(g){ mergedZs = mergedZs.concat(extractZodiacsInOrder(g)); });
            if (unit2 !== null && mergedZs.length === k) {
                return { type: '平特' + kCn + '连肖', count: 1, detail: mergedZs.join(''), unit: unit2, subtotal: unit2 };
            }
        }
        for (var gi = 0; gi < groups.length; gi++) {
            var zs = extractZodiacsInOrder(groups[gi]);
            if (zs.length < k || unit2 === null) continue;
            var c = C(zs.length, k);
            tc += c;
            ta += c * unit2;
            dp.push(zs.join(''));
        }
        if (tc > 0) return { type: '平特' + kCn + '连肖', count: tc, detail: dp.join(' '), unit: unit2, subtotal: ta };
        return null;
    }
    var pairRe = /([鼠牛虎兔龙蛇马羊猴鸡狗猪]+)\s*((?:[一二两三四五六七八九][百千])|[一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱)?/g;
    var pm;
    var pairedGroups = [];
    while ((pm = pairRe.exec(rest)) !== null) {
        pairedGroups.push({ zs: extractZodiacsInOrder(pm[1]), unit: parseAmountCN(pm[2]) });
    }
    var validPaired = pairedGroups.filter(function(g){ return g.zs.length >= k && g.unit !== null; });
    var totalZs = extractZodiacsInOrder(rest).length;
    var expectedGroups = Math.floor(totalZs / k);
    if (validPaired.length >= expectedGroups && expectedGroups > 0) {
        var tc2 = 0;
        var ta2 = 0;
        var dp2 = [];
        var items2 = [];
        for (var gi2 = 0; gi2 < validPaired.length; gi2++) {
            var g2 = validPaired[gi2];
            var c2 = C(g2.zs.length, k);
            tc2 += c2;
            ta2 += c2 * g2.unit;
            dp2.push(g2.zs.join(''));
            items2.push({ type: '平特' + kCn + '连肖', count: c2, detail: g2.zs.join(''), unit: g2.unit, subtotal: c2 * g2.unit });
        }
        if (items2.length > 1) return { _multi: true, items: items2 };
        var avgUnit2 = tc2 > 0 ? (ta2 / tc2) : 0;
        return { type: '平特' + kCn + '连肖', count: tc2, detail: dp2.join(' '), unit: avgUnit2, subtotal: ta2 };
    }
    var unit3 = null;
    var endM3 = rest.match(amtEndRe);
    if (endM3) {
        unit3 = parseAmountCN(endM3[1]);
        rest = rest.substring(0, endM3.index).trim();
    }
    // 前缀金额：如"各20 猪羊鸡龙..."
    if (unit3 === null) {
        var startM3 = rest.match(/^(?:各|每组|各组)\s*((?:[一二两三四五六七八九][百千])|[一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?\s*/);
        if (startM3) {
            unit3 = parseAmountCN(startM3[1]);
            rest = rest.substring(startM3[0].length).trim();
        }
    }
    if (unit3 === null) return null;
    var zs3 = extractZodiacsInOrder(rest);
    if (zs3.length < k) return null;
    var sub = [];
    for (var ii = 0; ii + k <= zs3.length; ii += k) {
        sub.push(zs3.slice(ii, ii + k));
    }
    var tc3 = 0;
    var ta3 = 0;
    var dp3 = [];
    for (var sj = 0; sj < sub.length; sj++) {
        var gg = sub[sj];
        var cc = C(gg.length, k);
        tc3 += cc;
        ta3 += cc * unit3;
        dp3.push(gg.join(''));
    }
    if (tc3 === 0) return null;
    return { type: '平特' + kCn + '连肖', count: tc3, detail: dp3.join(' '), unit: unit3, subtotal: ta3 };
}

function tryParseZodiacGroupsByTilde(line){
    if (line.indexOf('~') === -1) return null;
    if (/二中二|三中三|二中二|三中二|平特|特码|正码|尾|波|头|不中|复式|复试/.test(line)) return null;
    var unit = null;
    var amtM = line.match(/各?\s*((?:[一二两三四五六七八九][百千]?)|[一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?\s*$/);
    if (amtM) {
        unit = parseAmountCN(amtM[1]);
        line = line.substring(0, amtM.index).trim();
    }
    if (unit === null) return null;
    var segs = line.split(/~/).map(function(s){ return s.trim(); }).filter(Boolean);
    if (segs.length === 0) return null;
    var groups = [];
    for (var i = 0; i < segs.length; i++) {
        var zs = extractZodiacsInOrder(segs[i]);
        if (zs.length === 0) return null;
        groups.push(zs);
    }
    var k = groups[0].length;
    if (k < 2 || k > 5) return null;
    for (var gi = 0; gi < groups.length; gi++) {
        if (groups[gi].length !== k) return null;
    }
    var typeName = '平特' + (K_CN[String(k)] || '') + '连肖';
    var detail = groups.map(function(g){ return g.join(''); }).join(' ');
    return { type: typeName, count: groups.length, detail: detail + ' (共' + groups.length + '组)', unit: unit, subtotal: groups.length * unit };
}

function tryParseMultiPingTe(line){
    if (!/平特/.test(line)) return null;
    if (/连肖|连[^肖]|复式|复试/.test(line)) return null;
    if (/平特[二三四五2-5]肖/.test(line)) return null;
    line = line.replace(/^(奥|澳|新奥|新澳|澳特|奥特|澳门)\s*/, '');
    var segs = line.split(/[，,]/).map(function(s){ return s.trim(); }).filter(Boolean);
    var totalCount = 0;
    var totalAmount = 0;
    var detailParts = [];
    var segmentItems = [];
    for (var i = 0; i < segs.length; i++) {
        var seg = segs[i];
        var amtM = seg.match(/((?:[一二两三四五六七八九][百千])|[一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?\s*$/);
        if (!amtM) continue;
        var unit = parseAmountCN(amtM[1]);
        if (unit === null) continue;
        var numsPart = seg.substring(0, amtM.index).replace(/平特/g, '').replace(/^新澳|^澳门|^香港|^奥特|^奥|^澳|^新奥|^澳特/, '').replace(/各/g, '').replace(/肖/g, '').trim();
        var zs = extractZodiacsInOrder(numsPart);
        if (zs.length === 0) continue;
        totalCount += zs.length;
        totalAmount += zs.length * unit;
        detailParts.push(zs.join(''));
        segmentItems.push({ zs: zs, unit: unit });
    }
    if (totalCount === 0) return null;
    if (segmentItems.length > 1) {
        var items = [];
        for (var mi = 0; mi < segmentItems.length; mi++) {
            var it = segmentItems[mi];
            items.push({ type: '平特一肖', count: it.zs.length, detail: it.zs.join(''), unit: it.unit, subtotal: it.zs.length * it.unit });
        }
        return { _multi: true, items: items };
    }
    var avgUnitP = totalCount > 0 ? (totalAmount / totalCount) : 0;
    return { type: '平特一肖', count: totalCount, detail: detailParts.join(' '), unit: avgUnitP, subtotal: totalAmount };
}

// 新增：纯生肖+各+金额 = 特码生肖（每生肖展开4个号码），如"牛兔各100"=8注×100=800
// 也支持"特肖...各号..."格式，如"特肖猪狗猴羊蛇各号3元"=5生肖×4号×3=60
function tryParseZodiacTeMaList(line){
    var cleaned = line.replace(/^[\s\(（]+/, '').replace(/[\s\)）]+$/, '').replace(/^(奥特|新澳|澳门|新澳门|澳|奥|新奥|澳特|香港|香)\s*/, '').replace(/[，,：:]/g, ' ');
    // 必须是纯生肖开头（2个以上生肖），后跟各+金额，不能有"连"、"平特"、"复式"等词
    if (/连肖|平特|复式|复试|肖连|二中二|三中三|正码/.test(cleaned)) return null;
    // 格式1：纯生肖+各+金额，如"牛兔各100"、"兔各10"
    var m = cleaned.match(/^((?:[鼠牛虎兔龙蛇马羊猴鸡狗猪]){1,})\s*各?\s*(?:数|号)?\s*((?:[一二两三四五六七八九][百千]?)|[一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?\s*$/);
    // 格式2：特肖+生肖+各号+金额，如"特肖猪狗猴羊蛇各号3元"、"特肖虎一百米"
    var m2 = cleaned.match(/^特肖?\s*((?:[鼠牛虎兔龙蛇马羊猴鸡狗猪]){1,})\s*各?\s*(?:数|号)?\s*((?:[一二两三四五六七八九][百千]?)|[一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?\s*$/);
    var matched = m || m2;
    if (!matched) return null;
    var zs = extractZodiacsInOrder(matched[1]);
    if (zs.length < 1) return null;
    var unit = parseAmountCN(matched[2]);
    if (unit === null) return null;
    var nums = [];
    zs.forEach(function(z){ nums = nums.concat(ZODIAC[z] || []); });
    return { type: '特码', count: nums.length, detail: zs.join(''), unit: unit, subtotal: nums.length * unit };
}

function tryParsePingShort(line){
    var cleaned = line.replace(/^[\s\(（]+/, '').replace(/[\s\)）]+$/, '').replace(/^(奥特|新澳|澳门|新澳门|澳|奥|新奥|澳特|香港|香)\s*/, '').replace(/[，,：:]/g, ' ');
    // 单生肖：平虎100 / 平特虎100（只有明确"平"开头才算平特一肖，"特肖"开头的算特码生肖）
    var m = cleaned.match(/^平特?肖?\s*([鼠牛虎兔龙蛇马羊猴鸡狗猪])(?!特)\s*(?:各)?\s*((?:[一二两三四五六七八九][百千])|[一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?\s*$/);
    if (m) {
        var unit = parseAmountCN(m[2]);
        if (unit === null) return null;
        return { type: '平特一肖', count: 1, detail: m[1], unit: unit, subtotal: unit };
    }
    // 多生肖：平特虎牛各100（只有明确"平"开头才算平特一肖）
    var m2 = cleaned.match(/^平特?肖?\s*((?:[鼠牛虎兔龙蛇马羊猴鸡狗猪]){2,})\s*(?:各)?\s*(?:数|号)?\s*((?:[一二两三四五六七八九][百千])|[一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?\s*$/);
    if (m2) {
        var unit2 = parseAmountCN(m2[2]);
        if (unit2 === null) return null;
        var zs = extractZodiacsInOrder(m2[1]);
        return { type: '平特一肖', count: zs.length, detail: zs.join(''), unit: unit2, subtotal: zs.length * unit2 };
    }
    return null;
}

// ===== 新增特码玩法：头尾、单双波色组合、家禽野兽 =====
var JIAQIN = [1,6,8,9,10,12,13,18,20,21,22,24,25,30,32,33,34,36,37,42,44,45,46,48,49];
var YESHOU = [2,3,4,5,7,11,14,15,16,17,19,23,26,27,28,29,31,35,38,39,40,41,43,47];
function getHeadNums(h){
    var r=[];
    for(var i=1;i<=49;i++){
        if(parseInt(i/10)===h || (h===0 && i<10)) r.push(i);
    }
    return r;
}
function getTailNums(t){
    var r=[];
    for(var i=1;i<=49;i++){ if(i%10===t) r.push(i); }
    return r;
}
function filterOddEven(nums,oe){
    if(oe==='单') return nums.filter(function(n){return n%2===1;});
    if(oe==='双') return nums.filter(function(n){return n%2===0;});
    return nums;
}
function tryParseTeMaNew(text){
    var cleaned = text.replace(/^(奥特|新澳|新澳门|澳门|新奥|香港|香|澳|奥|澳特)\s*/, '').trim();
    // 金额提取：末尾数字+单位
    var unit = 5;
    var amtM = cleaned.match(/(?:各|个|每个|每|数)?\s*([一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?\s*$/);
    if (amtM) {
        var u = parseAmountCN(amtM[1]);
        if (u !== null && u >= 1 && u < 100000) {
            unit = u;
            cleaned = cleaned.substring(0, amtM.index);
        }
    }
    cleaned = cleaned.replace(/[，,：:各个每数米块元钱快闷文蚊斤\s]+$/,'').trim();

    // 1. 头尾：1头、2头、0头5尾、1，2头、0尾5尾、0124头等
    var headDigits = cleaned.match(/([0-4]+)头/);
    var headMatches = cleaned.match(/[0-4]头/g);
    var tailMatches = cleaned.match(/([0-9])尾/g);
    if (headDigits || tailMatches) {
        var nums = [];
        var labels = [];
        if (headDigits) {
            for (var hi=0; hi<headDigits[1].length; hi++) {
                var hn = parseInt(headDigits[1][hi]);
                getHeadNums(hn).forEach(function(n){ if(nums.indexOf(n)===-1) nums.push(n); });
                labels.push(headDigits[1][hi]+'头');
            }
        } else if (headMatches) {
            headMatches.forEach(function(h){
                var hn = parseInt(h);
                getHeadNums(hn).forEach(function(n){ if(nums.indexOf(n)===-1) nums.push(n); });
                labels.push(h);
            });
        }
        if (tailMatches) {
            tailMatches.forEach(function(t){
                var tn = parseInt(t);
                getTailNums(tn).forEach(function(n){ if(nums.indexOf(n)===-1) nums.push(n); });
                labels.push(t);
            });
        }
        if (nums.length > 0) {
            return { type: '特码', count: nums.length, detail: labels.join(','), unit: unit, subtotal: nums.length * unit, _nums: nums };
        }
    }

    // 2. 波色+单双组合：红单、红双、蓝单、蓝双、绿单、绿双
    var colorOE = cleaned.match(/^(红|蓝|绿|紅)(单|双)$/);
    if (colorOE) {
        var colorSet = colorOE[1]==='红' ? RED : (colorOE[1]==='蓝' ? BLUE : GREEN);
        var oeSet = filterOddEven(colorSet, colorOE[2]);
        return { type: '特码', count: oeSet.length, detail: colorOE[1]+colorOE[2], unit: unit, subtotal: oeSet.length * unit, _nums: oeSet };
    }
    // 2b. 包波色：包绿波、红波、蓝波全包
    var baoColor = cleaned.match(/^包?(红波|藍波|蓝波|绿波|紅波|绿球|红球|蓝球)$/);
    if (baoColor) {
        var cs = baoColor[1].indexOf('红')!==-1 ? RED : (baoColor[1].indexOf('蓝')!==-1 ? BLUE : GREEN);
        return { type: '特码', count: cs.length, detail: baoColor[1].replace(/包/,''), unit: unit, subtotal: cs.length * unit, _nums: cs };
    }
    // 2c. 单数/双数全包
    if (/^单数?$/.test(cleaned)) {
        var oddNums = []; for (var oi=1; oi<=49; oi+=2) oddNums.push(oi);
        return { type: '特码', count: oddNums.length, detail: '单', unit: unit, subtotal: oddNums.length * unit, _nums: oddNums };
    }
    if (/^双数?$/.test(cleaned)) {
        var evenNums = []; for (var ei=2; ei<=48; ei+=2) evenNums.push(ei);
        return { type: '特码', count: evenNums.length, detail: '双', unit: unit, subtotal: evenNums.length * unit, _nums: evenNums };
    }

    // 3. 家禽/野兽：包家禽、家禽单数、野兽双数等
    var jiaM = cleaned.match(/^包?(家禽|野兽)(单|双)?$/);
    if (jiaM) {
        var baseSet = jiaM[1]==='家禽' ? JIAQIN : YESHOU;
        var oeSet2 = filterOddEven(baseSet, jiaM[2]||'');
        return { type: '特码', count: oeSet2.length, detail: jiaM[1]+(jiaM[2]||''), unit: unit, subtotal: oeSet2.length * unit, _nums: oeSet2 };
    }

    return null;
}

// 逗号分组连肖：平特四肖，虎鼠狗猪，蛇兔鸡猴，每组各10米
// 也支持：蛇鸡鼠，蛇鸡牛，... 3连肖各组10米
// 新增：逗号分隔、每组连数不同（如"鼠狗龙3连20文，鼠龙狗兔4连20文"）
function tryParseMixedLianXiao(text){
    if (!text.match(/[，,]/)) return null;
    if (!/[鼠牛虎兔龙蛇马羊猴鸡狗猪]/.test(text)) return null;
    var parts = text.split(/[，,]/).map(function(p){ return p.trim(); }).filter(function(p){
        return /[鼠牛虎兔龙蛇马羊猴鸡狗猪]/.test(p);
    });
    if (parts.length < 2) return null;
    var items = [];
    for (var i=0; i<parts.length; i++) {
        var p = parts[i];
        // 提取连数：3连、4连、三连、四连等
        var km = p.match(/([二三四五2-5])\s*连/);
        if (!km) continue;
        var kMap = { '二':2, '2':2, '三':3, '3':3, '四':4, '4':4, '五':5, '5':5 };
        var k = kMap[km[1]];
        if (!k) continue;
        // 提取生肖
        var zs = extractZodiacsInOrder(p);
        if (zs.length < k) continue;
        // 提取金额
        var am = p.match(/([一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?\s*$/);
        var unit = am ? parseAmountCN(am[1]) : null;
        if (unit === null) continue;
        var typeName = '平特' + (K_CN[String(k)]||'') + '连肖';
        items.push({ type: typeName, count: 1, detail: zs.join(''), unit: unit, subtotal: unit });
    }
    if (items.length >= 2) return { _multi: true, items: items };
    // 新增：开头"4连"等，后面逗号多组生肖，每组k个
    var headKm = text.match(/^([二三四五2-5])\s*连\s*/);
    if (headKm && text.match(/[，,]/)) {
        var hkMap = { '二':2, '2':2, '三':3, '3':3, '四':4, '4':4, '五':5, '5':5 };
        var hk = hkMap[headKm[1]];
        if (hk) {
            var rest2 = text.substring(headKm[0].length);
            var hParts = rest2.split(/[，,]/).map(function(p){ return p.trim(); }).filter(function(p){
                return /[鼠牛虎兔龙蛇马羊猴鸡狗猪]/.test(p);
            });
            var rest2b = rest2.replace(/[。.;；\s]+$/,'');
            var ham = rest2b.match(/([一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?\s*$/);
            var hunit = ham ? parseAmountCN(ham[1]) : null;
            if (hunit !== null) {
                var hitems = [];
                hParts.forEach(function(p){
                    var p2 = p.replace(/[。.;；\s]+$/,'');
                    p2 = p2.replace(/各?\s*([一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?\s*$/,'');
                    var zs = extractZodiacsInOrder(p2);
                    if (zs.length >= hk) {
                        hitems.push({ type: '平特'+(K_CN[String(hk)]||'')+'连肖', count: 1, detail: zs.join(''), unit: hunit, subtotal: hunit });
                    }
                });
                if (hitems.length >= 2) return { _multi: true, items: hitems };
            }
        }
    }
    // 新增：逗号分隔混合平特玩法，如"平特鼠牛兔三连10文，平特鼠牛各200"
    if (/平特/.test(text) && text.match(/[，,]/)) {
        var ptParts = text.split(/[，,]/).map(function(p){ return p.trim(); }).filter(function(p){
            return /平特/.test(p);
        });
        if (ptParts.length >= 2) {
            var ptItems = [];
            ptParts.forEach(function(pp){
                var pAm = pp.match(/([一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?\s*$/);
                var pUnit = pAm ? parseAmountCN(pAm[1]) : null;
                if (pUnit === null) return;
                var pRest = pp.replace(/平特/g, '').replace(pAm ? pAm[0] : '', '').trim();
                var pZs = extractZodiacsInOrder(pRest);
                var pKm = pp.match(/([二三四五2-5])\s*(?:连|肖)/);
                if (pKm) {
                    var pKMap = {'二':2,'2':2,'三':3,'3':3,'四':4,'4':4,'五':5,'5':5};
                    var pK = pKMap[pKm[1]];
                    if (pK && pZs.length >= pK) {
                        ptItems.push({ type: '平特'+(K_CN[String(pK)]||'')+'连肖', count: 1, detail: pZs.join(''), unit: pUnit, subtotal: pUnit });
                    }
                } else if (pZs.length >= 1) {
                    pZs.forEach(function(z){
                        ptItems.push({ type: '平特一肖', count: 1, detail: z, unit: pUnit, subtotal: pUnit });
                    });
                }
            });
            if (ptItems.length >= 2) return { _multi: true, items: ptItems };
        }
    }
    return null;
}
function tryParseCommaLianXiao(text){
    if (!text.match(/[，,]/)) return null;
    if (!/连肖|连|肖|平特/.test(text)) return null;
    if (!/[鼠牛虎兔龙蛇马羊猴鸡狗猪]/.test(text)) return null;
    if (/\n/.test(text) && text.split(/\n/).length > 2) return null;
    // 提取玩法类型
    var isPingTe = /平特/.test(text);
    var kMatch = text.match(/([二三四五2-5])\s*(?:连)?\s*肖/);
    var k = kMatch ? parseInt(kMatch[1].match(/\d/) ? kMatch[1] : ({'二':2,'三':3,'四':4,'五':5}[kMatch[1]] || 0)) : 0;
    // 清理：去掉玩法词和噪音
    var cleaned = text
        .replace(/平特/g, '')
        .replace(/[二三四五2-5]\s*(?:连)?\s*肖/g, '')
        .replace(/^(奥特|新澳|新澳门|澳门|新奥|香港|香|澳|奥|澳特)\s*/, '')
        .replace(/各组|每组各|每组|各/g, '')
        .replace(/[，,：:\s]+$/g, '')
        .trim();
    // 金额
    var unit = 5;
    var amtM = text.match(/(?:各组|每组各|每组|各)\s*([一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?/);
    if (amtM) unit = parseAmountCN(amtM[1]);
    // 按逗号分组
    var parts = cleaned.split(/[，,]/).map(function(p){ return p.trim(); }).filter(function(p){
        return /[鼠牛虎兔龙蛇马羊猴鸡狗猪]/.test(p) && p.replace(/[鼠牛虎兔龙蛇马羊猴鸡狗猪]/g,'').length < 3;
    });
    if (parts.length < 2) return null;
    var groups = [];
    parts.forEach(function(p){
        var zs = extractZodiacsInOrder(p);
        if (zs.length >= 2) groups.push(zs);
    });
    if (groups.length === 0) return null;
    // 如果k未指定，用第一组生肖个数
    if (k === 0) k = groups[0].length;
    var typeName = (isPingTe ? '平特' : '') + ['','','二连肖','三连肖','四连肖','五连肖'][k] || (k+'连肖');
    var items = groups.map(function(zs){
        return { type: typeName, count: 1, detail: zs.join('-'), unit: unit, subtotal: unit };
    });
    return { _multi: true, items: items };
}

// 特码空格分隔不同单价：特码:24 十 12 五
function tryParseSpacedTeMaPairs(text){
    if (!/特码|特碼/.test(text)) return null;
    if (!/[一二三四五六七八九十两]/.test(text)) return null;
    var cleaned = text.replace(/特码:?|特碼:?/g, '').replace(/^(奥特|新澳|新澳门|澳门|新奥|香港|香|澳|奥|澳特)\s*/, '').trim();
    // 匹配：号码+中文金额 重复
    var pairs = [];
    var re = /(\d{1,2})\s*([一二两三四五六七八九十][百千]?|[一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?/g;
    var m;
    while ((m = re.exec(cleaned)) !== null) {
        var num = parseInt(m[1]);
        var amt = parseAmountCN(m[2]);
        if (num >= 1 && num <= 49 && amt && amt > 0 && amt < 100000) {
            pairs.push({ num: num, amt: amt });
        }
    }
    if (pairs.length < 2) return null;
    var items = pairs.map(function(p){
        return { type: '特码', count: 1, detail: pad(p.num), unit: p.amt, subtotal: p.amt };
    });
    return { _multi: true, items: items };
}

function tryParseFuShiSanZhongSan(text){
    text = text.replace(/复试/g, '复式');
    if (!/三中三复式|复式三中三|复式\s*3中3|3中3复式/.test(text)) return null;
    var rest = text.replace(/^(奥特|新澳|澳门|澳|奥|新奥|澳特)\s*/, '').replace(/三中三复式|复式三中三|复式\s*3中3|3中3复式/g, '').replace(/[:：]/g, ' ').trim();
    var unit = null;
    var amtM = rest.match(/\/?\s*每组\s*((?:[一二两三四五六七八九][百千]?)|[一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?/);
    if (amtM) {
        unit = parseAmountCN(amtM[1]);
        rest = rest.substring(0, amtM.index);
    } else {
        var endM = rest.match(/((?:[一二两三四五六七八九][百千]?)|[一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?\s*$/);
        if (endM) {
            unit = parseAmountCN(endM[1]);
            rest = rest.substring(0, endM.index);
        }
    }
    if (unit === null) return null;
    var nums = extractNumsInOrder(rest);
    if (nums.length < 3) return null;
    var count = C(nums.length, 3);
    return { type: '复式三中三', count: count, detail: nums.map(pad).join('-') + ' (' + nums.length + '选3=' + count + '注)', unit: unit, subtotal: count * unit };
}

// 新增：复式二中二（和复式三中三同逻辑，k=2）
function tryParseFuShiErZhongEr(text){
    text = text.replace(/复试/g, '复式');
    if (!/二中二复式|复式二中二|复式\s*2中2|2中2复式/.test(text)) return null;
    var rest = text.replace(/^(奥特|新澳|澳门|澳|奥|新奥|澳特)\s*/, '').replace(/二中二复式|复式二中二|复式\s*2中2|2中2复式/g, '').replace(/[:：]/g, ' ').trim();
    var unit = null;
    var amtM = rest.match(/\/?\s*每组\s*((?:[一二两三四五六七八九][百千]?)|[一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?/);
    if (amtM) {
        unit = parseAmountCN(amtM[1]);
        rest = rest.substring(0, amtM.index);
    } else {
        var endM = rest.match(/((?:[一二两三四五六七八九][百千]?)|[一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?\s*$/);
        if (endM) {
            unit = parseAmountCN(endM[1]);
            rest = rest.substring(0, endM.index);
        }
    }
    if (unit === null) return null;
    var nums = extractNumsInOrder(rest);
    if (nums.length < 2) return null;
    var count = C(nums.length, 2);
    return { type: '复式二中二', count: count, detail: nums.map(pad).join('-') + ' (' + nums.length + '选2=' + count + '注)', unit: unit, subtotal: count * unit };
}

function tryParseTeMaList(text){
    if (!/[各个]\s*(?:数|号)?\s*[一二三四五六七八九十两零〇\d]/.test(text)) return null;
    if (/三中三|二中二|三中二|四全中|二中特|特串|不中|连肖|平特|复式|复试|肖连/.test(text)) return null;
    if (/[\n\r]/.test(text)) {
        var ac = (text.match(/[各个]\s*(?:数|号)?\s*[一二三四五六七八九十两零〇\d]+/g) || []).length;
        if (ac >= 2) return null;
    }
    var rest = text.replace(/\d+\s*期/g, '').replace(/(?:共计|合计|合|计)\s*[一二三四五六七八九十两零〇\d]+\s*(?:米|块|元|快|闷|文|蚊|斤)?/g, '').replace(/^新澳|^澳门|^香港|^奥特|^奥|^澳|^新奥|^澳特/, '').trim();
    var segs = rest.split(/[。]/).map(function(s){ return s.trim(); }).filter(Boolean);
    var totalCount = 0;
    var totalAmount = 0;
    var detailParts = [];
    for (var i = 0; i < segs.length; i++) {
        var seg = segs[i];
        var amtM = seg.match(/各\s*(?:数|号)?\s*((?:[一二两三四五六七八九][百千]?)|[一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?\s*[，,]?\s*$/);
        if (!amtM) continue;
        var unit = parseAmountCN(amtM[1]);
        if (unit === null) continue;
        var numsPart = seg.replace(amtM[0], '').trim();
        numsPart = numsPart.replace(/各\s*(?:数|号)?\s*(?:[一二两三四五六七八九][百千]?|[一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?/g, '');
        var nums = extractNumsKeepDup(numsPart);
        if (nums.length === 0) continue;
        totalCount += nums.length;
        totalAmount += nums.length * unit;
        detailParts.push(nums.map(pad).join(' '));
    }
    if (totalCount === 0) return null;
    var avgUnitT = totalCount > 0 ? (totalAmount / totalCount) : 0;
    return { type: '特码', count: totalCount, detail: detailParts.join('；'), unit: avgUnitT, subtotal: totalAmount };
}

function tryParseZhengMaByIndex(line){
    var m = line.match(/^正码([一二三四五六123456])/);
    if (!m) return null;
    var idx = chineseToNumber(m[1]);
    var am = line.match(/([一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱)?$/);
    if (!am) return null;
    var unit = chineseToNumber(am[1]);
    if (unit === null) return null;
    var content = line.replace(/^正码[一二三四五六123456]/, '').replace(am[0], '').trim();
    var nums = extractNumsInOrder(content);
    if (nums.length === 0) return null;
    var cn = ['一', '二', '三', '四', '五', '六'][idx - 1];
    return { type: '正码' + cn, count: nums.length, detail: content, unit: unit, subtotal: nums.length * unit };
}

function extractTailsInOrder(str){
    var re = /(\d)尾/g;
    var found = [];
    var m;
    while ((m = re.exec(str)) !== null) found.push(parseInt(m[1]));
    return Array.from(new Set(found));
}

function numsByTails(tails){
    var set = new Set();
    tails.forEach(function(t){
        for (var n = 1; n <= 49; n++) {
            if (n % 10 === t) set.add(n);
        }
    });
    return Array.from(set).sort(function(a, b){ return a - b; });
}

function tryParseTail(line){
    if (!/(\d)尾/.test(line)) return null;
    var am = line.match(/([一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱)?$/);
    if (!am) return null;
    var unit = chineseToNumber(am[1]);
    if (unit === null) return null;
    var content = line.replace(am[0], '').trim();
    var tails = extractTailsInOrder(content);
    if (tails.length === 0) return null;
    var nums = numsByTails(tails);
    var detail = tails.map(function(t){ return t + '尾(' + numsByTails([t]).map(pad).join(' ') + ')'; }).join(' ');
    return { type: '尾数', count: nums.length, detail: detail, unit: unit, subtotal: nums.length * unit };
}

function tryParseHalfWave(line){
    var m = line.match(/^(大|小)(红|蓝|绿)波?/);
    if (!m) return null;
    var size = m[1];
    var color = m[2];
    var am = line.match(/([一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱)?$/);
    if (!am) return null;
    var unit = chineseToNumber(am[1]);
    if (unit === null) return null;
    var colorPool = { '红': RED, '蓝': BLUE, '绿': GREEN }[color];
    var filtered = colorPool.filter(function(n){ return size === '大' ? n >= 25 : n <= 24; });
    if (filtered.length === 0) return null;
    return { type: '半波', count: filtered.length, detail: size + color + '波 (' + filtered.map(pad).join(' ') + ')', unit: unit, subtotal: filtered.length * unit };
}

function tryParseHead(line){
    var m = line.match(/^([0-4])头/);
    if (!m) return null;
    var head = parseInt(m[1]);
    var am = line.match(/([一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱)?$/);
    if (!am) return null;
    var unit = chineseToNumber(am[1]);
    if (unit === null) return null;
    var start = head === 0 ? 1 : head * 10;
    var nums = [];
    for (var n = start; n <= head * 10 + 9 && n <= 49; n++) nums.push(n);
    return { type: head + '头', count: nums.length, detail: nums.map(pad).join(' '), unit: unit, subtotal: nums.length * unit };
}

var SPLIT_AMOUNT_RE = /(?:各组|每组|一组|各|每个|每个数|各数|各号|每个号|每|个|压|号)\s*(?:数|号)?\s*([一二两三四五六七八九十百千零〇\d]+(?:\.\d+)?)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤|块钱|阅)?/g;
var SPLIT_ZODIAC_AMT_RE = /([鼠牛虎兔龙蛇马羊猴鸡狗猪]{2,5})\s*[~\-]?\s*([一二两三四五六七八九十百千零〇\d]+(?:\.\d+)?)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤|阅)?(?!\s*连)/g;
var SPLIT_PINGTE_AMT_RE = /平特?([鼠牛虎兔龙蛇马羊猴鸡狗猪])\s*([一二两三四五六七八九十百千零〇\d]+(?:\.\d+)?)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤|阅)?/g;
var SPLIT_ZODIAC_TE_AMT_RE = /([鼠牛虎兔龙蛇马羊猴鸡狗猪])特\s*([一二两三四五六七八九十百千零〇\d]+(?:\.\d+)?)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤|阅)?/g;
var SPLIT_SUMMARY_RE = /(共计|合计|合|计|共)\s*[一二两三四五六七八九十百千零〇\d]+\s*(?:米|块|元|块钱|快|闷|文|蚊|斤|块钱|阅)?/g;

function cleanSplitSeg(s){
    s = s.replace(SPLIT_SUMMARY_RE, ' ');
    s = s.replace(/^[，。、,\.\s\-~\/()（）:：钱\s]+/, '');
    s = s.replace(/[，。、,\.\s()（）:：;；钱]+$/, '');
    s = s.replace(/^(新澳门|澳门|新澳|新奥|奥特|澳特|老奥|香港|香|奥|澳)\s*[:：]?\s*/, '');
    s = s.replace(/(新澳门|澳门|新澳|新奥|奥特|澳特|老奥|香港|香)\s*$/g, '');
    s = s.replace(/[，。、,\s;；]+$/, '');
    return s.trim();
}

function splitByRegexLocal(text, re){
    re.lastIndex = 0;
    var matches = [];
    var m;
    while ((m = re.exec(text)) !== null) {
        matches.push({ start: m.index, end: m.index + m[0].length });
    }
    if (matches.length <= 1) return [text];
    var segs = [];
    var prevEnd = 0;
    for (var i = 0; i < matches.length; i++) {
        var seg = text.substring(prevEnd, matches[i].end).trim();
        if (seg) segs.push(seg);
        prevEnd = matches[i].end;
    }
    var tail = text.substring(prevEnd).trim();
    if (tail) segs.push(tail);
    return segs.filter(function(s){ return s; });
}

function splitAtAmountBoundaries(text){
    // 新增保护：复式多档（生肖+复式+多个"连各X"）不被切分
    if (/[鼠牛虎兔龙蛇马羊猴鸡狗猪].*?(复式|复试).*?[二三四五2-5]连.*?各.*?[。；;].*?[二三四五2-5]连.*?各/.test(text) ||
        /[鼠牛虎兔龙蛇马羊猴鸡狗猪].*?复试[二三四五2-5].*?各.*?[，,].*?复试[二三四五2-5].*?各/.test(text)) {
        return [text];
    }
    // 预处理：各+中文金额后面紧跟阿拉伯数字时，加空格分隔（避免吞下一段号码）
    text = text.replace(/(各[一二两三四五六七八九十百千零〇]+)(?=\d)/g, '$1 ');
    var lines = text.split(/[\n\r]+/).map(function(l){ return l.trim(); }).filter(function(l){
        if (!l) return false;
        if (/^(共计|合计|合|计|共)\s*[一二两三四五六七八九十百千零〇\d]+\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?\s*$/.test(l)) return false;
        if (/^\d+\s*期$/.test(l)) return false;
        return true;
    });
    var flat = lines.join('\n');
    var result = [];
    // 先处理整个文本的金额锚点
    var anchors = [];
    SPLIT_AMOUNT_RE.lastIndex = 0;
    var m;
    while ((m = SPLIT_AMOUNT_RE.exec(flat)) !== null) {
        anchors.push({ start: m.index, end: m.index + m[0].length });
    }
    SPLIT_ZODIAC_TE_AMT_RE.lastIndex = 0;
    while ((m = SPLIT_ZODIAC_TE_AMT_RE.exec(flat)) !== null) {
        anchors.push({ start: m.index, end: m.index + m[0].length });
    }
    anchors.sort(function(a, b){ return a.start - b.start; });
    var segs;
    if (anchors.length > 0) {
        segs = [];
        var prevEnd = 0;
        for (var i = 0; i < anchors.length; i++) {
            segs.push(flat.substring(prevEnd, anchors[i].end));
            prevEnd = anchors[i].end;
        }
        var tail = flat.substring(prevEnd).trim();
        if (tail) {
            var hasPlay = /二中二|2中2|三中三|3中3|三中二|四全中|二连|三连|四连|五连|平特|特码|特碼|正码|尾数|半波|头|复式|复试|肖连|连肖/.test(tail);
            if (segs.length > 0 && !hasPlay) segs[segs.length - 1] += ' ' + tail;
            else segs.push(tail);
        }
    } else {
        segs = [flat];
    }
    segs.forEach(function(seg){
        // 在每个segment内部，如果有多个括号对，拆出来
        var parenParts = seg.match(/[（(][^）)]*[）)]/g);
        if (parenParts && parenParts.length > 1) {
            parenParts.forEach(function(p){
                var inner = p.replace(/^[（(]/, '').replace(/[）)]$/, '').trim();
                if (inner) result.push(inner);
            });
            // 括号外的内容也保留
            var outside = seg.replace(/[（(][^）)]*[）)]/g, ' ').trim();
            if (outside) result.push(outside);
        } else {
            var s1 = splitByRegexLocal(seg, SPLIT_ZODIAC_AMT_RE);
            // 如果第一段有连肖玩法词前缀，传播到后续段
            if (s1.length > 1) {
                var prefixMatch = s1[0].match(/^(.*?(?:二连|三连|四连|五连|二肖|三肖|四肖|五肖|平特二|平特三|平特四|平特五|复式二|复式三|复式四|复式五)[^\u4e00-\u9fa5]*?)(?=[鼠牛虎兔龙蛇马羊猴鸡狗猪])/);
                if (prefixMatch) {
                    var playPrefix = prefixMatch[1].replace(/[鼠牛虎兔龙蛇马羊猴鸡狗猪].*$/, '');
                    if (playPrefix) {
                        for (var pi = 1; pi < s1.length; pi++) {
                            if (!/(?:二连|三连|四连|五连|平特|复式)/.test(s1[pi])) {
                                s1[pi] = playPrefix + s1[pi];
                            }
                        }
                    }
                }
            }
            s1.forEach(function(s12){
                var s2 = splitByRegexLocal(s12, SPLIT_PINGTE_AMT_RE);
                s2.forEach(function(s23){ result.push(cleanSplitSeg(s23)); });
            });
        }
    });
    // 玩法词继承：前一段有三中三/二中二，后一段纯号码+金额时继承玩法词
    for (var ri = 1; ri < result.length; ri++) {
        var prev = result[ri - 1];
        var cur = result[ri];
        if (!prev || !cur) continue;
        var playM = prev.match(/(三中三|3中3|二中二|2中2|三中二|3中2)/);
        if (playM && !/(三中三|3中3|二中二|2中2|三中二|3中2|连肖|平特|特码|生肖)/.test(cur)) {
            // 后一段纯号码+金额，继承玩法词
            result[ri] = playM[1] + ' ' + cur;
        }
    }
    return result.filter(function(s){ return s; });
}

// ===== 新增补丁：同一消息内连续出现多个“生肖组合 + 连/联玩法 + 金额”时逐项拆分 =====
// 仅在识别到至少两个完整项目、且项目之间没有其他实质文字时启用，避免影响旧格式。
function tryParseAdjacentZodiacLianItems(text){
    var re = /([鼠牛虎兔龙蛇马羊猴鸡狗猪]{2,5})\s*([二三四五2-5])\s*(?:连|联)\s*(?:(?:各组|每组|一组|各|每)\s*)?([一二两三四五六七八九十百千零〇\d]+(?:\.\d+)?)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤|阅)?/g;
    var matches = [];
    var m;
    while ((m = re.exec(text)) !== null){
        var kMap = {'二':2,'三':3,'四':4,'五':5,'2':2,'3':3,'4':4,'5':5};
        var k = kMap[m[2]];
        var amount = parseAmountCN(m[3]);
        var zodiacs = extractZodiacsInOrder(m[1]);
        if (!k || amount === null || zodiacs.length !== k) continue;
        matches.push({start:m.index,end:m.index+m[0].length,result:{type:'平特'+(K_CN[String(k)]||'')+'连肖',count:1,detail:zodiacs.join(''),unit:amount,subtotal:amount},original:m[0].trim()});
    }
    if (matches.length < 2) return null;
    var cursor = 0;
    for (var i = 0; i < matches.length; i++){
        var between = text.substring(cursor, matches[i].start);
        if (between && !/^[\s，,。；;、.\-~]*$/.test(between)) return null;
        cursor = matches[i].end;
    }
    if (text.substring(cursor) && !/^[\s，,。；;、.\-~]*$/.test(text.substring(cursor))) return null;
    return matches.map(function(item){
        return {special:true,result:item.result,original:item.original};
    });
}

// ===== 新增补丁：同一段文本内多种“每组金额”玩法分块解析 =====
// 仅在检测到至少两个明确的二中二/三中三玩法标题时启用；
// 每个标题到下一个标题之间作为独立玩法块，避免跨玩法串组。
function tryParseMixedZhongBetBlocks(text){
    var lines = String(text || '').split(/[\r\n]+/).map(function(line){ return line.trim(); });
    var headerRe = /^\s*(二中二|三中三|2中2|3中3)\s*(?:每组|各组)\s*([一二两三四五六七八九十百千零〇\d]+)\s*(?:元|米|块|块钱|快|闷|文|蚊|斤)?\s*[。；;，,]?\s*$/;
    var blocks = [];
    var current = null;
    var invalid = false;

    function parseGroupsFromLine(line, expectedK){
        var matches = line.match(/\d{1,2}(?:\s*[-–—/／]\s*\d{1,2}){1,2}/g) || [];
        if (!matches.length) return null;
        var residue = line;
        matches.forEach(function(m){ residue = residue.replace(m, ''); });
        residue = residue.replace(/[【】\[\]（）()\s，,。；;、]+/g, '');
        if (residue) return null;
        var groups = [];
        for (var i = 0; i < matches.length; i++){
            var nums = matches[i].match(/\d{1,2}/g) || [];
            if (nums.length !== expectedK) return null;
            var values = nums.map(function(n){ return parseInt(n, 10); });
            if (values.some(function(n){ return n < 1 || n > 49; })) return null;
            groups.push(values.map(pad).join('-'));
        }
        return groups;
    }

    for (var i = 0; i < lines.length; i++){
        var line = lines[i];
        if (!line) continue;
        var hm = line.match(headerRe);
        if (hm){
            current = {
                type: /^(?:二中二|2中2)$/.test(hm[1]) ? '二中二' : '三中三',
                k: /^(?:二中二|2中2)$/.test(hm[1]) ? 2 : 3,
                unit: parseAmountCN(hm[2]),
                groups: []
            };
            if (current.unit === null || current.unit < 0) return null;
            blocks.push(current);
            continue;
        }
        if (!current) return null;
        var parsed = parseGroupsFromLine(line, current.k);
        if (!parsed){
            invalid = true;
            break;
        }
        current.groups = current.groups.concat(parsed);
    }

    if (invalid || blocks.length < 2 || blocks.some(function(b){ return b.groups.length === 0; })) return null;
    return blocks.map(function(block){
        return {
            special: true,
            result: {
                type: block.type,
                count: block.groups.length,
                detail: block.groups.join(' ') + ' (共' + block.groups.length + '组)',
                unit: block.unit,
                subtotal: block.groups.length * block.unit
            },
            original: text.trim()
        };
    });
}

// ===== 新增补丁：混合二中二/三中三时保护标题与各自明细，不让旧金额切割器提前串段 =====
// 原 splitAtAmountBoundaries 函数完整保留；仅对本补丁能够完整识别的混合玩法文本旁路旧切割。
var splitAtAmountBoundariesOriginal = splitAtAmountBoundaries;
splitAtAmountBoundaries = function(text){
    if (typeof tryParseMixedZhongBetBlocks === 'function' && tryParseMixedZhongBetBlocks(text)) return [text];
    return splitAtAmountBoundariesOriginal(text);
};

function splitIntoSegments(text){
    // 新增补丁：混合二中二/三中三标题时，按标题边界分别统计，不合并玩法。
    var mixedZhongBlocks = tryParseMixedZhongBetBlocks(text);
    if (mixedZhongBlocks) return mixedZhongBlocks;
    // 新增补丁：同一行多个生肖连肖投注逐条独立解析。
    var adjacentZodiacItems = tryParseAdjacentZodiacLianItems(text);
    if (adjacentZodiacItems) return adjacentZodiacItems;
    // 新增：玩法头行+多组生肖（换行或空格分隔），如"三连肖 猴羊鼠 牛龙兔 各35"
    var flatText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    var headPlayM = flatText.match(/^(三连肖|四连肖|二连肖|五连肖|三肖|四肖|二肖|五肖|平特三肖|平特四肖|平特二肖|平特五肖)\s+(.+?)\s*各?\s*([一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?\s*$/);
    if (headPlayM) {
        var playName2 = headPlayM[1];
        var bodyText = headPlayM[2];
        var unit2 = parseAmountCN(headPlayM[3]);
        var zsGroups = bodyText.split(/\s+/).filter(function(p){ return /[鼠牛虎兔龙蛇马羊猴鸡狗猪]/.test(p); });
        if (zsGroups.length >= 2 && unit2 !== null) {
            var kMap3 = {'二':2,'三':3,'四':4,'五':5};
            var km3 = playName2.match(/([二三四五])/);
            var k3 = km3 ? kMap3[km3[1]] : 0;
            var items3 = [];
            zsGroups.forEach(function(g){
                var zs = extractZodiacsInOrder(g);
                if (zs.length >= 2) {
                    items3.push({ type: '平特'+(K_CN[String(k3||zs.length)]||'')+'连肖', count: 1, detail: zs.join(''), unit: unit2, subtotal: unit2 });
                }
            });
            if (items3.length >= 2) return items3.map(function(it){ return { special: true, result: it, original: text.trim() }; });
        }
    }
    // 新增：二中二中文横线"16一35 20斤"在最前面处理
    if (/^二中二?\s*\d+\s*一\s*\d+/.test(text)) {
        var fixed = text.replace(/一/g, '-');
        var ezEAm = fixed.match(/([一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?\s*$/);
        var ezEUnit = ezEAm ? parseAmountCN(ezEAm[1]) : null;
        var fixedNoAm = ezEAm ? fixed.substring(0, ezEAm.index) : fixed;
        var ezENums = fixedNoAm.match(/\d+/g);
        if (ezENums && ezENums.length === 2 && ezEUnit !== null) {
            return [{ special: true, result: { type: '二中二', count: 1, detail: ezENums[0].padStart(2,'0')+'-'+ezENums[1].padStart(2,'0'), unit: ezEUnit, subtotal: ezEUnit }, original: text.trim() }];
        }
    }
    // 新增：复式多档，如"鸡 虎 龙 兔 牛 狗 复式. 4连各10。5连各15"、"虎猪马狗复试三各五，复试四各十"
    if (/复式|复试/.test(flatText) && /[二三四五2-5]/.test(flatText)) {
        var allZs = extractZodiacsInOrder(flatText);
        if (allZs.length >= 3) {
            var fuShiItems = [];
            var fsRe = /([二三四五2-5])\s*连\s*各?\s*([一二三四五六七八九十两零〇\d]+)/g;
            var fsM;
            while ((fsM = fsRe.exec(flatText)) !== null) {
                var fsKMap = {'二':2,'2':2,'三':3,'3':3,'四':4,'4':4,'五':5,'5':5};
                var fsK = fsKMap[fsM[1]];
                var fsUnit = parseAmountCN(fsM[2]);
                if (fsK && fsUnit !== null && allZs.length >= fsK) {
                    var fsCnt = C(allZs.length, fsK);
                    fuShiItems.push({ type: '复式'+fsK+'肖连', count: fsCnt, detail: allZs.join('')+' ('+allZs.length+'选'+fsK+')', unit: fsUnit, subtotal: fsCnt*fsUnit });
                }
            }
            if (fuShiItems.length === 0) {
                var fs2Re = /复试\s*([二三四五2-5])\s*各?\s*([一二三四五六七八九十两零〇\d]+)/g;
                while ((fsM = fs2Re.exec(flatText)) !== null) {
                    var fsKMap2 = {'二':2,'2':2,'三':3,'3':3,'四':4,'4':4,'五':5,'5':5};
                    var fsK2 = fsKMap2[fsM[1]];
                    var fsUnit2 = parseAmountCN(fsM[2]);
                    if (fsK2 && fsUnit2 !== null && allZs.length >= fsK2) {
                        var fsCnt2 = C(allZs.length, fsK2);
                        fuShiItems.push({ type: '复式'+fsK2+'肖连', count: fsCnt2, detail: allZs.join('')+' ('+allZs.length+'选'+fsK2+')', unit: fsUnit2, subtotal: fsCnt2*fsUnit2 });
                    }
                }
            }
            if (fuShiItems.length >= 2) return fuShiItems.map(function(it){ return { special: true, result: it, original: text.trim() }; });
        }
    }
    // 新增：二中二/三中三"每组X元"+多组号码
    var ezEHead = flatText.match(/^(二中二|三中三)\s*每组\s*([一二三四五六七八九十两零〇\d]+)\s*元?\s*(.+)$/);
    if (ezEHead) {
        var playType = ezEHead[1].indexOf('二') !== -1 ? '二中二' : '三中三';
        var ezEUnit = parseAmountCN(ezEHead[2]);
        var numBody = ezEHead[3];
        var numGroups = numBody.split(/[\s\n]+/).map(function(g){ return g.trim(); }).filter(function(g){ return /\d+[-–]\d+/.test(g); });
        if (ezEUnit !== null && numGroups.length >= 2) {
            var items4 = [];
            numGroups.forEach(function(g){
                var nums = g.match(/\d+/g);
                if (nums && (nums.length === 2 || nums.length === 3)) {
                    items4.push({ type: playType, count: 1, detail: nums.map(function(n){return n.padStart(2,'0');}).join('-'), unit: ezEUnit, subtotal: ezEUnit });
                }
            });
            if (items4.length >= 2) return items4.map(function(it){ return { special: true, result: it, original: text.trim() }; });
        }
    }
    var multi = tryMultiSplit(text);
    if (multi && multi.length > 1) {
        var result = [];
        multi.forEach(function(p){
            var sub = splitIntoSegments(p);
            sub.forEach(function(s){ result.push(s); });
        });
        return result;
    }

    var fushiSzS = tryParseFuShiSanZhongSan(text);
    if (fushiSzS) return [{ special: true, result: fushiSzS, original: text.trim() }];
    var fushiEzE = tryParseFuShiErZhongEr(text);
    if (fushiEzE) return [{ special: true, result: fushiEzE, original: text.trim() }];
    var multiSzS = tryParseSlashSanZhongSan(text) || tryParseMultiSanZhongSan(text);
    if (multiSzS) return [{ special: true, result: multiSzS, original: text.trim() }];
    // 新增：二中二/三中三里的中文"一"当分隔符，如"二中二16一35 20斤"
    if (/^二中二?\s*\d+\s*一\s*\d+/.test(text)) {
        var fixed = text.replace(/一/g, '-');
        var ezENums = fixed.match(/\d+/g);
        var ezEAm = fixed.match(/([一二三四五六七八九十两零〇\d]+)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?\s*$/);
        var ezEUnit = ezEAm ? parseAmountCN(ezEAm[1]) : null;
        if (ezENums && ezENums.length === 2 && ezEUnit !== null) {
            return [{ special: true, result: { type: '二中二', count: 1, detail: ezENums[0].padStart(2,'0')+'-'+ezENums[1].padStart(2,'0'), unit: ezEUnit, subtotal: ezEUnit }, original: text.trim() }];
        }
    }
    var smartEzE = tryParseErZhongErSmart(text);
    if (smartEzE) return [{ special: true, result: smartEzE, original: text.trim() }];
    var commaLianXiao = tryParseMixedLianXiao(text) || tryParseCommaLianXiao(text);
    if (commaLianXiao) {
        if (commaLianXiao._multi && commaLianXiao.items) {
            return commaLianXiao.items.map(function(it){ return { special: true, result: it, original: text.trim() }; });
        }
        return [{ special: true, result: commaLianXiao, original: text.trim() }];
    }
    var teMaNew = tryParseTeMaNew(text);
    if (teMaNew) return [{ special: true, result: teMaNew, original: text.trim() }];
    var teMaList = tryParseTeMaList(text);
    if (teMaList) return [{ special: true, result: teMaList, original: text.trim() }];
    var commaSzS = tryParseCommaSZS(text);
    if (commaSzS) return [{ special: true, result: commaSzS, original: text.trim() }];
    var sanZhongEr = tryParseSanZhongEr(text);
    if (sanZhongEr) return [{ special: true, result: sanZhongEr, original: text.trim() }];
    var sanZhongSan = tryParseSanZhongSanDirect(text);
    if (sanZhongSan) return [{ special: true, result: sanZhongSan, original: text.trim() }];
    var erZhongEr = tryParseErZhongEr(text);
    if (erZhongEr) return [{ special: true, result: erZhongEr, original: text.trim() }];

    var lines = text.split(/[\n\r]+/).map(function(l){ return l.trim(); }).filter(Boolean);
    // 跨行合并：纯生肖行 + 下一行含玩法词/金额时合并；玩法行 + 纯生肖行也合并
    var merged = [];
    for (var li = 0; li < lines.length; li++) {
        var cur = lines[li];
        var isPureZodiac = /^[鼠牛虎兔龙蛇马羊猴鸡狗猪\s]+$/.test(cur) && cur.replace(/\s/g,'').length >= 2;
        if (isPureZodiac && li + 1 < lines.length) {
            var next = lines[li+1];
            if (/连肖|连|复式|复试|平特|肖|三中三|二中二|各组|各/.test(next)) {
                merged.push(cur + ' ' + next);
                li++;
                continue;
            }
        }
        // 反向：玩法/金额行 + 下一行纯生肖
        var isPlayLine = /连肖|连|复式|复试|平特|4连|3连|2连|5连|个\d+|各\d+|各\s*[一二三四五六七八九十百千]/.test(cur) && !/[鼠牛虎兔龙蛇马羊猴鸡狗猪]/.test(cur);
        if (isPlayLine && li + 1 < lines.length) {
            var next2 = lines[li+1];
            var nextPureZodiac = /^[鼠牛虎兔龙蛇马羊猴鸡狗猪\s]+$/.test(next2) && next2.replace(/\s/g,'').length >= 2;
            if (nextPureZodiac) {
                merged.push(cur + ' ' + next2);
                li++;
                continue;
            }
        }
        merged.push(cur);
    }
    // 后处理：最后一行是玩法+金额行时，前面所有生肖组行合并进来
    if (merged.length >= 2) {
        var lastLine = merged[merged.length - 1];
        var isPlayAmt = /连肖|连|复式|复试|平特|肖/.test(lastLine) && /各|组/.test(lastLine) && /\d|[一二三四五六七八九十百千]/.test(lastLine);
        if (isPlayAmt) {
            var zodiacLines = [];
            for (var zi = 0; zi < merged.length - 1; zi++) {
                var zl = merged[zi];
                var cleanZl = zl.replace(/[，,。.\s]/g, '');
                if (/^[鼠牛虎兔龙蛇马羊猴鸡狗猪]+$/.test(cleanZl) && cleanZl.length >= 2) {
                    zodiacLines.push(zl);
                }
            }
            if (zodiacLines.length === merged.length - 1 && zodiacLines.length >= 2) {
                merged = [zodiacLines.join(' ') + ' ' + lastLine];
            }
        }
    }
    lines = merged.map(function(l){ return l.replace(/各\s*[.，,]\s*/g, '各').replace(/各\s*$/,'').trim(); }).filter(Boolean);
    var segments = [];

    lines.forEach(function(line){
        if (/(?:^共\s*[一二三四五六七八九十两零〇\d])|(?:^(?:共计|合计|合|计)\s*[一二三四五六七八九十两零〇\d])/.test(line)) return;
        var extra = tryParseTeMaNew(line)
                 || tryParseZhengMaByIndex(line)
                 || tryParseTail(line)
                 || tryParseHalfWave(line)
                 || tryParseHead(line)
                 || tryParseLianXiaoReverse(line)
                 || tryParseZodiacGroupsByTilde(line)
                 || tryParseZodiacTeMaList(line)
                 || tryParsePingShort(line)
                 || tryParseSpacedTeMaPairs(line)
                 || tryParseCommaLianXiao(line)
                 || tryParseSanZhongEr(line)
                 || tryParseCommaSZS(line)
                 || tryParseMultiPingTe(line);
        if (extra) {
            if (extra._multi && extra.items) {
                for (var mi = 0; mi < extra.items.length; mi++) {
                    segments.push({ special: true, result: extra.items[mi], original: line });
                }
            } else {
                segments.push({ special: true, result: extra, original: line });
            }
            return;
        }
        var special = tryParsePingAndLian(line);
        if (special) {
            segments.push({ special: true, result: special, original: line });
            return;
        }
        var amountRegex = /(.*?)(?:各|个|每个|每|号|[xX=])\s*([一二三四五六七八九十百千两零〇\d]+(?:\.\d+)?)\s*(?:米|块|元|块钱|元钱|阅|斤)?/g;
        var match;
        var found = false;
        while ((match = amountRegex.exec(line)) !== null) {
            var content = match[1].trim();
            var amount = parseAmountCN(match[2]);
            content = content.replace(/(各|个|每个|每|号)$/g, '').trim();
            if (content && amount !== null) {
                found = true;
                segments.push({ content: content, unit: amount, original: match[0].trim() });
            }
        }
        if (!found && line) {
            var endAmount = line.match(/(.+?)(?:各|个|每个|每)?\s*([一二三四五六七八九十百千两零〇\d]+)\s*(?:米|块|元|块钱|阅|斤)*$/);
            if (endAmount) {
                var c2 = endAmount[1].trim().replace(/(各|个|每个|每|号)$/g, '').trim();
                var a2 = parseAmountCN(endAmount[2]);
                if (c2 && a2 !== null && a2 >= 1) {
                    segments.push({ content: c2, unit: a2, original: line });
                    return;
                }
            }
            segments.push({ content: line, unit: 10, original: line });
        }
    });
    return segments;
}

function parseSegment(content, unit){
    var line = content.replace(/乘以|个|元|块|米/g, '').trim();
    if (!line) return null;
    if (/特码|特碼|特號|特号|^特\s|^特$|^特[^码碼]|中特/.test(line) || /^特/.test(line)) {
        var pureText = line.replace(/^(特码|特碼|特號|特号|特)/, '').trim();
        if (/红波|紅波|红球/.test(line)) return { type: '特码', count: RED.length, detail: '红波', unit: unit };
        if (/蓝波|藍波|蓝球/.test(line)) return { type: '特码', count: BLUE.length, detail: '蓝波', unit: unit };
        if (/绿波|綠波|绿球/.test(line)) return { type: '特码', count: GREEN.length, detail: '绿波', unit: unit };
        if (/(特码?|特)\s*单|特单/.test(line) && !/双/.test(line)) return { type: '特码', count: 25, detail: '单', unit: unit };
        if (/(特码?|特)\s*双|特双/.test(line)) return { type: '特码', count: 24, detail: '双', unit: unit };
        if (/(特码?|特)\s*大|特大/.test(line) && !/小/.test(line)) return { type: '特码', count: 25, detail: '大', unit: unit };
        if (/(特码?|特)\s*小|特小/.test(line)) return { type: '特码', count: 24, detail: '小', unit: unit };
        var zs = extractZodiacsInOrder(line);
        if (zs.length) {
            var nums = [];
            zs.forEach(function(z){ nums = nums.concat(ZODIAC[z] || []); });
            return { type: '特码', count: nums.length, detail: pureText || zs.join(''), unit: unit };
        }
        var nums2 = extractNumsInOrder(line);
        if (nums2.length) return { type: '特码', count: nums2.length, detail: content, unit: unit };
    }
    if (/正码|正碼/.test(line)) {
        var n3 = extractNumsInOrder(line);
        if (n3.length) return { type: '正码', count: n3.length, detail: content, unit: unit };
    }
    var k = 0;
    var typeName = '';
    if (/三中三|3中3/.test(line)) {
        k = 3;
        typeName = '三中三';
    } else if (/三中二|3中2/.test(line)) {
        k = 3;
        typeName = '三中二';
    } else if (/四全中|4全中|四中四/.test(line)) {
        k = 4;
        typeName = '四全中';
    } else if (/二中特|2中特/.test(line)) {
        k = 2;
        typeName = '二中特';
    } else if (/特串/.test(line)) {
        k = 2;
        typeName = '特串';
    }
    if (k > 0) {
        var numsK = extractNumsInOrder(line);
        if (numsK.length >= k) {
            var countK = C(numsK.length, k);
            return { type: typeName, count: countK, detail: numsK.map(pad).join(' ') + ' (' + numsK.length + '个号复式=' + countK + '组)', unit: unit };
        }
        return { error: typeName + ' 号码不足' };
    }
    if (/不中/.test(line)) {
        var need = 5;
        if (/五不中|5不中/.test(line)) need = 5;
        else if (/六不中|6不中/.test(line)) need = 6;
        else if (/七不中|7不中/.test(line)) need = 7;
        else if (/八不中|8不中/.test(line)) need = 8;
        else if (/九不中|9不中/.test(line)) need = 9;
        else if (/十不中|10不中/.test(line)) need = 10;
        var numsN = extractNumsInOrder(line);
        if (numsN.length >= need) {
            var countN = C(numsN.length, need);
            return { type: need + '不中', count: countN, detail: numsN.map(pad).join(' ') + ' (' + numsN.length + '选' + need + '=' + countN + '注)', unit: unit };
        }
        return { error: need + '不中 号码不足' };
    }
    if (/肖连|连肖/.test(line)) {
        var kk = 3;
        if (/二肖|2肖/.test(line)) kk = 2;
        else if (/三肖|3肖/.test(line)) kk = 3;
        else if (/四肖|4肖/.test(line)) kk = 4;
        else if (/五肖|5肖/.test(line)) kk = 5;
        var zsL = extractZodiacsInOrder(line);
        if (zsL.length >= kk) {
            var countL = C(zsL.length, kk);
            return { type: '平特' + (K_CN[String(kk)] || '') + '连肖', count: countL, detail: zsL.join(''), unit: unit };
        }
    }
    var xTeMatch = line.match(/^([鼠牛虎兔龙蛇马羊猴鸡狗猪])特$/);
    if (xTeMatch) {
        return { type: '平特一肖', count: 1, detail: xTeMatch[1], unit: unit };
    }
    var onlyZ = extractZodiacsInOrder(line);
    if (onlyZ.length && extractNumsInOrder(line).length === 0) {
        var numsZ = [];
        onlyZ.forEach(function(z){ numsZ = numsZ.concat(ZODIAC[z] || []); });
        return { type: '特码', count: numsZ.length, detail: content, unit: unit };
    }
    var onlyN = extractNumsInOrder(line);
    if (onlyN.length) return { type: '号码', count: onlyN.length, detail: content, unit: unit };
    return { error: '无法识别：' + line };
}

// ===== 新增：网名+时间锚点切段预处理器（原有解析算法零改动，仅在入口过滤）=====
var TIME_DATE_RE = /^\s*(?:\d{4}\s*[-/年]\s*)?\d{1,2}\s*[-/月]\s*\d{1,2}\s*日?\s*(?:凌晨|早上|早晨|上午|中午|下午|晚上|晚)?\s*(?:周[一二三四五六日天]|星期[一二三四五六日天])?\s*\d{1,2}\s*[:：]\s*\d{2}(?:\s*[:：]\s*\d{2})?\s*$/;
var TIME_ONLY_RE = /^\s*\d{1,2}\s*[:：]\s*\d{2}\s*$/;
var TIME_PERIOD_RE = /^\s*(?:凌晨|早上|早晨|上午|中午|下午|晚上|晚)\s*\d{1,2}\s*[:：]\s*\d{2}\s*$/;
var NICKNAME_BLOCK_RE = /三中三|3中3|二中二|2中2|三中二|3中2|四全中|平特|特码|特碼|正码|尾数|半波|复式|复试|连肖|连码|生肖|头|各|每|米|块|元|块钱|快|闷|文|蚊|斤|组|[鼠牛虎兔龙蛇马羊猴鸡狗猪]|\d/;

function isTimeLine(line){
    line = line.trim();
    return TIME_DATE_RE.test(line) || TIME_ONLY_RE.test(line) || TIME_PERIOD_RE.test(line);
}

function preprocessTimeBatches(text){
    var lines = text.split(/\n/);
    var hasTime = false;
    for (var i = 0; i < lines.length; i++) {
        if (isTimeLine(lines[i])) { hasTime = true; break; }
    }
    if (!hasTime) return text;
    var keep = [];
    for (var j = 0; j < lines.length; j++) {
        var line = lines[j].trim();
        if (isTimeLine(line)) {
            if (keep.length > 0 && !NICKNAME_BLOCK_RE.test(keep[keep.length - 1])) {
                keep.pop();
            }
            continue;
        }
        if (line) keep.push(line);
    }
    return keep.join('\n');
}

function countMessageGroupsForPasteTip(text){
    var lines = String(text || '').split(/\r?\n/);
    var count = 0;
    for (var i = 0; i < lines.length; i++){
        if (isTimeLine(lines[i])){
            // 一个非空网名行紧邻一个时间行，即计为一个独立单元组。
            var j = i - 1;
            while (j >= 0 && !String(lines[j] || '').trim()) j--;
            if (j >= 0) count++;
        }
    }
    return count;
}

function showPasteTip(text){
    var el = document.getElementById("pasteTip");
    if (!el) return;
    var groups = countMessageGroupsForPasteTip(text);
    el.textContent = '识别出了 ' + groups + ' 个单元组';
    el.style.display = 'block';
    setTimeout(function(){ el.style.display = 'none'; }, 4000);
}

function calculate(){
    var inputEl = document.getElementById("commandInput");
    var text = inputEl.value.trim();
    var errorTip = document.getElementById("errorTip");
    errorTip.style.display = 'none';
    errorTip.innerHTML = '';
    document.getElementById("copySuccess").style.display = 'none';
    if (!text) return;
    var preText = preprocessTimeBatches(text);
    var docs = splitAtAmountBoundaries(preText);
    var added = 0;
    var errors = [];
    docs.forEach(function(docText){
        var segments = splitIntoSegments(docText);
        segments.forEach(function(seg){
            if (seg.special && seg.result) {
                var r = seg.result;
                if (r._multi && r.items) {
                    for (var mi = 0; mi < r.items.length; mi++) {
                        var it = r.items[mi];
                        historyData.push({ id: Date.now() + Math.random() + mi, original: seg.original, type: it.type, detail: it.detail, count: it.count, unit: it.unit, subtotal: it.subtotal });
                        added++;
                    }
                    return;
                }
                historyData.push({ id: Date.now() + Math.random(), original: seg.original, type: r.type, detail: r.detail, count: r.count, unit: r.unit, subtotal: r.subtotal });
                added++;
                return;
            }
            var result = parseSegment(seg.content, seg.unit);
            if (!result) return;
            if (result.error) {
                errors.push(result.error);
                return;
            }
            var subtotal = result.count * result.unit;
            historyData.push({ id: Date.now() + Math.random(), original: seg.original, type: result.type, detail: result.detail, count: result.count, unit: result.unit, subtotal: subtotal });
            added++;
        });
    });
    if (errors.length) {
        errorTip.style.display = 'block';
        errorTip.innerHTML = errors.map(function(e){ return '• ' + e; }).join('<br>');
    }
    if (added > 0) {
        inputEl.value = "";
        renderHistory();
    }
}

// ===== 新增补丁：按“网名 + 时间”识别独立消息单元 =====
// 每个时间标记开启一个新单元；单元之间绝不拼接，单元内部仍完整交给原有算法。
function splitMessageBatches(text){
    var lines = String(text || '').split(/\r?\n/);
    var hasTime = lines.some(function(line){ return isTimeLine(line); });
    if (!hasTime) return [String(text || '')];

    var batches = [];
    var current = [];
    var preamble = [];
    var started = false;

    function isNicknameLineImmediatelyBeforeTime(line){
        // 用户规则：紧挨时间上一行不论是文字、数字或其他内容，均只作为网名标记。
        return !!String(line || '').trim();
    }
    function pushBatch(arr){
        var value = arr.join('\n').trim();
        if (value) batches.push(value);
    }

    for (var i = 0; i < lines.length; i++){
        var line = lines[i].trim();
        if (isTimeLine(line)){
            if (!started){
                // 时间前的最后一行是网名；若还有其他前置内容，保留为独立前置单元。
                if (preamble.length && isNicknameLineImmediatelyBeforeTime(preamble[preamble.length - 1])) preamble.pop();
                pushBatch(preamble);
                preamble = [];
                started = true;
            } else {
                // 下一条时间出现时，前一条消息结束。紧邻时间的网名只作为标记，不进入投注文本。
                if (current.length && isNicknameLineImmediatelyBeforeTime(current[current.length - 1])) current.pop();
                pushBatch(current);
                current = [];
            }
            continue;
        }
        if (!started){
            if (line) preamble.push(line);
        } else if (line){
            current.push(line);
        }
    }
    if (started){
        pushBatch(current);
    } else {
        pushBatch(preamble);
    }
    return batches.length ? batches : [String(text || '')];
}

// 保留原 calculate() 函数完整实现，通过引用供新入口逐单元调用。
var calculateSingleBatch = calculate;

// 新入口只负责隔离消息单元；每个单元仍调用原有 calculateSingleBatch()。
calculate = function(){
    var inputEl = document.getElementById("commandInput");
    var rawText = inputEl.value.trim();
    if (!rawText) return;

    var batches = splitMessageBatches(rawText);
    if (batches.length <= 1){
        inputEl.value = batches[0] || rawText;
        calculateSingleBatch();
        return;
    }

    var errorTip = document.getElementById("errorTip");
    var copySuccess = document.getElementById("copySuccess");
    errorTip.style.display = 'none';
    errorTip.innerHTML = '';
    copySuccess.style.display = 'none';

    var allErrors = [];
    var beforeCount = historyData.length;
    batches.forEach(function(batchText){
        inputEl.value = batchText;
        calculateSingleBatch();
        if (errorTip.style.display !== 'none' && errorTip.innerHTML){
            allErrors.push(errorTip.innerHTML);
        }
    });

    // 与原有交互保持一致：只要有成功新增记录，就清空输入框。
    if (historyData.length > beforeCount){
        inputEl.value = '';
        renderHistory();
    } else {
        inputEl.value = rawText;
    }
    if (allErrors.length){
        errorTip.style.display = 'block';
        errorTip.innerHTML = allErrors.join('<br>');
    }
};

function deleteItem(id){
    historyData = historyData.filter(function(item){ return item.id !== id; });
    renderHistory();
}

function copyResult(){
    if (historyData.length === 0) { alert('当前没有计算记录可复制'); return; }
    var bjTime = getBeijingTimeString();
    var text = '【澳门六合彩计算明细】\n';
    text += '下单时间：' + bjTime + '\n';
    text += '------------------------\n';
    historyData.forEach(function(item, idx){
        text += (idx + 1) + '. [' + item.type + '] ' + item.detail + '\n';
        text += '   ' + item.count + '注 × ' + item.unit + '元 = ' + item.subtotal + '元\n';
    });
    var total = historyData.reduce(function(sum, item){ return sum + item.subtotal; }, 0);
    var fmtTotal = Number.isInteger(total) ? total : parseFloat(total.toFixed(2));
    text += '------------------------\n总计：' + fmtTotal + ' 元\n';
    text += '共 ' + historyData.length + ' 项，' + historyData.reduce(function(s, i){ return s + i.count; }, 0) + ' 注';
    if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.writeText(text).then(function(){ showCopySuccess(); }).catch(function(){ fallbackCopy(text); });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text){
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        showCopySuccess();
    } catch (e) {
        alert('复制失败，请选择文本后手动复制');
    }
    document.body.removeChild(ta);
}

function showCopySuccess(){
    var el = document.getElementById("copySuccess");
    el.style.display = 'block';
    setTimeout(function(){ el.style.display = 'none'; }, 2000);
}

function renderHistory(){
    var listEl = document.getElementById("historyList");
    listEl.innerHTML = "";
    if (historyData.length === 0) {
        listEl.innerHTML = '<div class="empty-tip">暂无计算记录</div>';
        document.getElementById("totalDisplay").innerText = "总计: 0 元";
        var vsEl = document.getElementById("verifySummary");
        if (vsEl) {
            vsEl.classList.remove("show");
            vsEl.innerHTML = "";
        }
        lastVerifyDraw = null;
        return;
    }
    var totalSum = 0;
    historyData.forEach(function(item){
        totalSum += item.subtotal;
        var li = document.createElement("li");
        li.className = "history-item";
        var textSpan = document.createElement("span");
        textSpan.className = "text";
        textSpan.innerHTML = '<span class="type-tag">' + escapeHtmlVerify(item.type) + '</span> ' + renderVerifiedDetail(item) + '<br>' + item.count + '注 × ' + item.unit + '元 = <b>' + item.subtotal + '元</b>';
        if (item.verify) {
            var badge = document.createElement("span");
            badge.className = "verify-badge " + item.verify.status;
            badge.textContent = item.verify.label;
            textSpan.appendChild(document.createElement("br"));
            textSpan.appendChild(badge);
            if (item.verify.status === "hit") li.classList.add("is-hit");
        }
        var delBtn = document.createElement("button");
        delBtn.className = "btn-del";
        delBtn.textContent = "删除";
        delBtn.onclick = function(){ deleteItem(item.id); };
        li.appendChild(textSpan);
        li.appendChild(delBtn);
        listEl.appendChild(li);
    });
    listEl.scrollTop = listEl.scrollHeight;
    var fmtTotal = Number.isInteger(totalSum) ? totalSum : parseFloat(totalSum.toFixed(2));
    document.getElementById("totalDisplay").innerText = '总计: ' + fmtTotal + ' 元';
    updateAnalytics(fmtTotal);
}

function updateAnalytics(totalAmount){
    var panel = document.getElementById("analyticsPanel");
    if (!historyData || historyData.length === 0) { panel.style.display='none'; return; }
    panel.style.display='block';

    // 按type分组统计所有类型金额
    var typeAmounts = {};
    // 特码每个号码的金额
    var numAmount = {};
    for (var i=1;i<=49;i++) numAmount[i]=0;

    historyData.forEach(function(item){
        var t = item.type || '未知';
        if (t === '号码') t = '特码';
        typeAmounts[t] = (typeAmounts[t] || 0) + item.subtotal;

        if (t === '特码') {
            var nums = extractNumsInOrder(item.detail || '');
            if (nums.length === 0) {
                var zs = extractZodiacsInOrder(item.detail || '');
                var expanded = [];
                zs.forEach(function(z){ expanded = expanded.concat(ZODIAC[z]||[]); });
                nums = expanded;
            }
            if (nums.length > 0) {
                var perNum = item.subtotal / nums.length;
                nums.forEach(function(n){
                    if (n>=1 && n<=49) numAmount[n] += perNum;
                });
            }
        }
    });

    var pct = function(part, whole){
        if (!whole || whole === 0) return '0%';
        return (part/whole*100).toFixed(1) + '%';
    };

    // 所有类型汇总 - 带倍率盈亏
    var ODD_MAP = {
        '特码': 47,
        '平特一肖': 2,
        '二中二': 60,
        '复式二中二': 60,
        '三中三': 600,
        '复式三中三': 600,
        '平特二连肖': 4,
        '平特三连肖': 10,
        '平特四连肖': 30,
        '平特五连肖': 100,
        '复式二肖连': 4,
        '复式三肖连': 10,
        '复式四肖连': 30,
        '复式五肖连': 100
    };
    var fmtPnL = function(amount, odd, total) {
        var pnl = amount * odd - total;
        var sign = pnl >= 0 ? '+' : '';
        var color = pnl >= 0 ? '#2e7d32' : '#c62828';
        return ' <span style="color:'+color+';font-weight:bold">'+sign+Math.round(pnl)+'</span>';
    };
    var typesHtml = '';
    var typeKeys = Object.keys(typeAmounts).sort(function(a,b){ return typeAmounts[b]-typeAmounts[a]; });
    typeKeys.forEach(function(t){
        var amt = typeAmounts[t];
        var odd = ODD_MAP[t] || 0;
        var pnlStr = odd > 0 ? fmtPnL(amt, odd, amt) : '';
        typesHtml += '<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 6px;background:'+(typeKeys.indexOf(t)%2===0?'#fff':'#f5f5f5')+';border-radius:4px;">';
        typesHtml += '<span>'+t+'</span>';
        typesHtml += '<span><b>'+amt+'</b>元 / <span style="color:#f57f17;font-weight:bold">'+pct(amt,totalAmount)+'</span>'+pnlStr+'</span>';
        typesHtml += '</div>';
    });
    typesHtml += '<div style="display:flex;justify-content:space-between;padding:3px 6px;margin-top:4px;font-weight:bold;border-top:2px solid #ccc;">';
    typesHtml += '<span>总计</span><span>'+totalAmount+'元 / 100%</span></div>';
    document.getElementById('analyticsTypes').innerHTML = typesHtml;

    // 特码号码明细 - 按金额降序排列，显示盈亏
    var teMaTotal = (typeAmounts['特码'] || 0) + (typeAmounts['号码'] || 0);
    var numsEl = document.getElementById('analyticsNums');
    numsEl.innerHTML = '';
    var numList = [];
    for (var n=1; n<=49; n++) numList.push({n:n, amt:numAmount[n]});
    numList.sort(function(a,b){ return b.amt - a.amt; });
    var boColor = function(n){
        if (RED.indexOf(n)!==-1) return '#d32f2f';
        if (BLUE.indexOf(n)!==-1) return '#1976d2';
        if (GREEN.indexOf(n)!==-1) return '#388e3c';
        return '#999';
    };
    numList.forEach(function(item){
        var n = item.n, amt = item.amt;
        var div = document.createElement('div');
        div.style.cssText = 'padding:4px 6px;border-radius:4px;font-size:11px;line-height:1.3;';
        if (amt > 0) {
            div.style.background = '#fffde7';
            var pnl = teMaTotal - amt * 47;
            var sign = pnl >= 0 ? '+' : '';
            var pnlColor = pnl >= 0 ? '#2e7d32' : '#c62828';
            div.innerHTML = '<b style="color:'+boColor(n)+'">' + (n<10?'0':'') + n + '号</b> ' + Math.round(amt) + '元 <span style="color:'+pnlColor+';font-weight:bold">'+sign+Math.round(pnl)+'</span><br><span style="color:#f57f17;font-weight:bold">' + pct(amt,totalAmount) + '</span>';
        } else {
            div.style.background = '#f5f5f5';
            div.innerHTML = '<b style="color:#ccc">' + (n<10?'0':'') + n + '号</b> 0元 <span style="color:#ddd">+0</span><br><span style="color:#ddd">0%</span>';
        }
        numsEl.appendChild(div);
    });
}

var lastVerifyDraw = null;
var verifyStateBeforeLastRun = null;

function parseDrawNums(text){
    if (!text) return [];
    var m = String(text).match(/\d{1,2}/g) || [];
    var arr = m.map(Number).filter(function(n){ return n >= 1 && n <= 49; });
    return Array.from(new Set(arr));
}

function numToZodiac(n){
    if (n === null || n === undefined) return null;
    for (var z in ZODIAC) {
        if (ZODIAC[z].indexOf(n) !== -1) return z;
    }
    return null;
}

function colorOf(n){
    if (RED.indexOf(n) !== -1) return '红';
    if (BLUE.indexOf(n) !== -1) return '蓝';
    if (GREEN.indexOf(n) !== -1) return '绿';
    return '';
}

function combinationsOf(arr, k){
    var res = [];
    var n = arr.length;
    if (k > n || k <= 0) return res;
    var idx = [];
    for (var i = 0; i < k; i++) idx.push(i);
    while (true) {
        res.push(idx.map(function(i){ return arr[i]; }));
        var ii = k - 1;
        while (ii >= 0 && idx[ii] === ii + n - k) ii--;
        if (ii < 0) break;
        idx[ii]++;
        for (var j = ii + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
    }
    return res;
}

function numsInDetail(detail){
    var s = String(detail || '').replace(/[（(][^）)]*[）)]/g, ' ');
    var m = s.match(/\d{1,2}/g) || [];
    return m.map(Number).filter(function(n){ return n >= 1 && n <= 49; });
}

function numsInDetailKeepBracket(detail){
    var s = String(detail || '');
    var m = s.match(/\d{1,2}/g) || [];
    return m.map(Number).filter(function(n){ return n >= 1 && n <= 49; });
}

function hitResult(t){ return { status: 'hit', label: t }; }
function missResult(t){ return { status: 'miss', label: t }; }

function verifyZodiacPrecise(item, draw){
    var type = item.type || '';
    var detail = item.detail || '';
    if (!/肖/.test(type)) return null;
    var allDrawNums = draw.normal.slice();
    if (draw.special !== null) allDrawNums.push(draw.special);
    if (allDrawNums.length === 0) return { status: 'unknown', label: '⚠ 未输入开奖号码' };
    var drawZodiacSet = new Set();
    allDrawNums.forEach(function(n){ var z = numToZodiac(n); if (z) drawZodiacSet.add(z); });
    var zs = extractZodiacsInOrder(detail);
    if (!zs.length) return null;
    var k = 1;
    var km = type.match(/([二三四五2-5])\s*(?:连)?\s*肖/);
    if (km) {
        var kMap = { '二':2, '2':2, '三':3, '3':3, '四':4, '4':4, '五':5, '5':5 };
        k = kMap[km[1]] || 1;
    }
    if (k === 1) {
        var totalCount = zs.length;
        var matched = zs.filter(function(z){ return drawZodiacSet.has(z); });
        var matchedUnique = Array.from(new Set(matched));
        if (matchedUnique.length > 0) {
            return { status: 'hit', label: '✅ 中 ' + matchedUnique.length + '/' + totalCount + ' 注（' + matchedUnique.join('') + '）' };
        }
        return { status: 'miss', label: '❌ 未中 0/' + totalCount + ' 注' };
    }
    // 判断是否复式（detail里有"N选k=C注"标记）
    var isFushi = /选\d/.test(detail);
    if (isFushi) {
        var N = zs.length;
        if (N < k) return { status: 'unknown', label: '⚠ 投注生肖不足（需≥' + k + '个，现有' + N + '个）' };
        var total = C(N, k);
        var combos = combinationsOf(zs, k);
        var hitGroups = 0;
        combos.forEach(function(c){ if (c.every(function(z){ return drawZodiacSet.has(z); })) hitGroups++; });
        if (hitGroups > 0) return { status: 'hit', label: '✅ 中 ' + hitGroups + '/' + total + ' 组' };
        return { status: 'miss', label: '❌ 未中 0/' + total + ' 组' };
    }
    // 非复式：按空格分组，每组k个生肖全中才算中那组
    var cleanedDetail = detail.replace(/[（(][^）)]*[）)]/g, ' ');
    var tokens = cleanedDetail.split(/\s+/).filter(Boolean);
    var totalGroups = 0, hitGroups2 = 0;
    tokens.forEach(function(tok){
        var gZs = extractZodiacsInOrder(tok);
        if (gZs.length < k) return;
        totalGroups++;
        if (gZs.every(function(z){ return drawZodiacSet.has(z); })) hitGroups2++;
    });
    if (totalGroups === 0) {
        // 没有空格分组，整体作为一组
        totalGroups = 1;
        if (zs.every(function(z){ return drawZodiacSet.has(z); })) hitGroups2 = 1;
    }
    if (hitGroups2 > 0) return { status: 'hit', label: '✅ 中 ' + hitGroups2 + '/' + totalGroups + ' 组' };
    return { status: 'miss', label: '❌ 未中 0/' + totalGroups + ' 组' };
}

function verifyOneRecord(item, draw){
    var normal = draw.normal;
    var special = draw.special;
    var betNormal = normal.length ? normal : (special !== null ? [special] : []);
    var normalSet = new Set(betNormal);
    var type = item.type || '';
    var detail = item.detail || '';

    if (['三中三', '三中二', '四全中', '二中二', '复式三中三', '复式二中二'].indexOf(type) !== -1) {
        var k = 3, need = 3;
        if (type === '三中二') { k = 3; need = 2; }
        else if (type === '四全中') { k = 4; need = 4; }
        else if (type === '二中二' || type === '复式二中二') { k = 2; need = 2; }
        var isFushi = /复式|选\d/.test(detail);
        var total = 0, hit = 0;
        if (isFushi) {
            var pool = Array.from(new Set(numsInDetail(detail)));
            var combos = combinationsOf(pool, k);
            total = combos.length;
            combos.forEach(function(c){
                var h = c.filter(function(x){ return normalSet.has(x); }).length;
                if (h >= need) hit++;
            });
        } else {
            var cleaned = detail.replace(/[（(][^）)]*[）)]/g, ' ');
            var tokens = cleaned.split(/\s+/).filter(Boolean);
            tokens.forEach(function(t){
                var g = (t.match(/\d{1,2}/g) || []).map(Number).filter(function(n){ return n >= 1 && n <= 49; });
                if (g.length < k) return;
                total++;
                var h = g.filter(function(x){ return normalSet.has(x); }).length;
                if (h >= need) hit++;
            });
        }
        if (total === 0) return { status: 'unknown', label: '⚠ 无法验证' };
        if (hit > 0) return hitResult('✅ 中 ' + hit + '/' + total + ' 组');
        return missResult('❌ 未中 (0/' + total + ')');
    }

    if (type === '特码' || type === '号码') {
        if (special === null) return { status: 'unknown', label: '⚠ 未输入特码' };
        var dt = detail.trim();
        if (dt === '单') { if (special % 2 === 1) return hitResult('✅ 中（特码 ' + pad(special) + ' 为单）'); return missResult('❌ 未中（特码 ' + pad(special) + '）'); }
        if (dt === '双') { if (special % 2 === 0) return hitResult('✅ 中（特码 ' + pad(special) + ' 为双）'); return missResult('❌ 未中（特码 ' + pad(special) + '）'); }
        if (dt === '大') { if (special >= 25) return hitResult('✅ 中（特码 ' + pad(special) + ' 为大）'); return missResult('❌ 未中（特码 ' + pad(special) + '）'); }
        if (dt === '小') { if (special <= 24) return hitResult('✅ 中（特码 ' + pad(special) + ' 为小）'); return missResult('❌ 未中（特码 ' + pad(special) + '）'); }
        if (dt === '红波') { if (RED.indexOf(special) !== -1) return hitResult('✅ 中（特码 ' + pad(special) + ' 红波）'); return missResult('❌ 未中（特码 ' + pad(special) + ' ' + colorOf(special) + '波）'); }
        if (dt === '蓝波') { if (BLUE.indexOf(special) !== -1) return hitResult('✅ 中（特码 ' + pad(special) + ' 蓝波）'); return missResult('❌ 未中（特码 ' + pad(special) + ' ' + colorOf(special) + '波）'); }
        if (dt === '绿波') { if (GREEN.indexOf(special) !== -1) return hitResult('✅ 中（特码 ' + pad(special) + ' 绿波）'); return missResult('❌ 未中（特码 ' + pad(special) + ' ' + colorOf(special) + '波）'); }
        // 新增：头尾数验证
        var headM = dt.match(/^([0-4])$/);
        if (headM) { var hn = parseInt(headM[1]); var hitH = (hn===0 ? special<10 : parseInt(special/10)===hn); return hitH ? hitResult('✅ 中（特码 '+pad(special)+' '+hn+'头）') : missResult('❌ 未中（特码 '+pad(special)+'）'); }
        var tailM = dt.match(/^([0-9])$/);
        if (tailM) { var tn = parseInt(tailM[1]); var hitT = (special%10===tn); return hitT ? hitResult('✅ 中（特码 '+pad(special)+' '+tn+'尾）') : missResult('❌ 未中（特码 '+pad(special)+'）'); }
        // 新增：波色+单双
        var oeColorM = dt.match(/^(红|蓝|绿)(单|双)$/);
        if (oeColorM) {
            var cs = oeColorM[1]==='红'?RED:(oeColorM[1]==='蓝'?BLUE:GREEN);
            var inColor = cs.indexOf(special)!==-1;
            var oeMatch = oeColorM[2]==='单' ? (special%2===1) : (special%2===0);
            return (inColor && oeMatch) ? hitResult('✅ 中（特码 '+pad(special)+' '+dt+'）') : missResult('❌ 未中（特码 '+pad(special)+'）');
        }
        // 新增：家禽野兽
        var jyM = dt.match(/^(家禽|野兽)(单|双)?$/);
        if (jyM) {
            var jset = jyM[1]==='家禽'?JIAQIN:YESHOU;
            var inSet = jset.indexOf(special)!==-1;
            var oeOk = !jyM[2] || (jyM[2]==='单' ? special%2===1 : special%2===0);
            return (inSet && oeOk) ? hitResult('✅ 中（特码 '+pad(special)+' '+dt+'）') : missResult('❌ 未中（特码 '+pad(special)+'）');
        }
        // 新增：多尾数组合 "0,5"
        if (dt.indexOf(',') !== -1) {
            var parts = dt.split(',');
            var hitMulti = false;
            for (var pi=0; pi<parts.length; pi++) {
                var p = parts[pi];
                if (/^[0-9]$/.test(p) && special%10===parseInt(p)) { hitMulti = true; break; }
                if (/^[0-4]$/.test(p) && (parseInt(p)===0 ? special<10 : parseInt(special/10)===parseInt(p))) { hitMulti = true; break; }
            }
            return hitMulti ? hitResult('✅ 中（特码 '+pad(special)+'）') : missResult('❌ 未中（特码 '+pad(special)+'）');
        }
        var numsT = numsInDetail(detail);
        if (numsT.length) {
            if (numsT.indexOf(special) !== -1) return hitResult('✅ 中特码 ' + pad(special));
            return missResult('❌ 未中（特码 ' + pad(special) + '）');
        }
        var zsT = extractZodiacsInOrder(detail);
        if (zsT.length) {
            var sz = numToZodiac(special);
            if (zsT.indexOf(sz) !== -1) return hitResult('✅ 中（特码 ' + pad(special) + ' ' + sz + '）');
            return missResult('❌ 未中（特码 ' + pad(special) + ' ' + sz + '）');
        }
        return { status: 'unknown', label: '⚠ 无法验证' };
    }

    var zmMatch = type.match(/^正码([一二三四五六])$/);
    if (zmMatch) {
        var idx = ['一', '二', '三', '四', '五', '六'].indexOf(zmMatch[1]);
        if (draw.normal[idx] === undefined) return { status: 'unknown', label: '⚠ 未输入正码' + zmMatch[1] };
        var target = draw.normal[idx];
        var numsZm = numsInDetail(detail);
        if (numsZm.indexOf(target) !== -1) return hitResult('✅ 中（正码' + zmMatch[1] + '=' + pad(target) + '）');
        return missResult('❌ 未中（正码' + zmMatch[1] + '=' + pad(target) + '）');
    }

    if (type === '尾数') {
        if (special === null) return { status: 'unknown', label: '⚠ 未输入特码' };
        var tails = [];
        var re = /(\d)\s*尾/g;
        var m;
        while ((m = re.exec(detail)) !== null) tails.push(Number(m[1]));
        if (!tails.length) return { status: 'unknown', label: '⚠ 无法验证' };
        var st = special % 10;
        if (tails.indexOf(st) !== -1) return hitResult('✅ 中（特码 ' + pad(special) + ' 尾数 ' + st + '）');
        return missResult('❌ 未中（特码 ' + pad(special) + ' 尾数 ' + st + '）');
    }

    if (type === '半波') {
        if (special === null) return { status: 'unknown', label: '⚠ 未输入特码' };
        var numsH = numsInDetailKeepBracket(detail);
        if (numsH.indexOf(special) !== -1) return hitResult('✅ 中（特码 ' + pad(special) + '）');
        return missResult('❌ 未中（特码 ' + pad(special) + '）');
    }

    if (/^[0-4]头$/.test(type)) {
        if (special === null) return { status: 'unknown', label: '⚠ 未输入特码' };
        var numsHd = numsInDetail(detail);
        if (numsHd.indexOf(special) !== -1) return hitResult('✅ 中（特码 ' + pad(special) + '）');
        return missResult('❌ 未中（特码 ' + pad(special) + '）');
    }

    if (/肖/.test(type)) {
        var precise = verifyZodiacPrecise(item, draw);
        if (precise) return precise;
        if (special === null) return { status: 'unknown', label: '⚠ 未输入特码' };
        var zsX = extractZodiacsInOrder(detail);
        if (!zsX.length) return { status: 'unknown', label: '⚠ 无法验证' };
        var szX = numToZodiac(special);
        if (zsX.indexOf(szX) !== -1) return hitResult('✅ 中（特码 ' + pad(special) + ' ' + szX + '）');
        return missResult('❌ 未中（特码 ' + pad(special) + ' ' + szX + '）');
    }

    if (/不中$/.test(type)) {
        var numsB = numsInDetail(detail);
        if (!numsB.length) return { status: 'unknown', label: '⚠ 无法验证' };
        var allMiss = numsB.every(function(n){ return !normalSet.has(n); });
        if (allMiss) return hitResult('✅ 中（所投号码均未开出）');
        return missResult('❌ 未中（有号码开出）');
    }

    if (type === '二中特' || type === '特串') {
        if (special === null) return { status: 'unknown', label: '⚠ 未输入特码' };
        var numsE = numsInDetail(detail);
        if (numsE.indexOf(special) !== -1) return hitResult('✅ 中（特码 ' + pad(special) + '）');
        return missResult('❌ 未中（特码 ' + pad(special) + '）');
    }

    return { status: 'unknown', label: '⚠ 暂不支持该玩法验证' };
}

function escapeHtmlVerify(value){
    return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// 只在该条明细判定中奖时，将其中实际命中的号码/生肖标红；未中奖明细保持黑色。
function renderVerifiedDetail(item){
    var raw = String(item.detail == null ? '' : item.detail);
    if (!item.verify || item.verify.status !== 'hit' || !lastVerifyDraw) return escapeHtmlVerify(raw);
    var isSpecialOnly = item.type === '特码' || item.type === '号码';
    var drawNums = new Set(isSpecialOnly ? (lastVerifyDraw.special === null ? [] : [lastVerifyDraw.special]) : (lastVerifyDraw.normal || []));
    if (/肖/.test(item.type || '') && lastVerifyDraw.special !== null) drawNums.add(lastVerifyDraw.special);
    var drawZodiacs = new Set();
    drawNums.forEach(function(n){ var z = numToZodiac(n); if (z) drawZodiacs.add(z); });
    var type = item.type || '';
    var isNumberGroup = /^(?:复式)?(?:二中二|三中三|三中二|四全中)$/.test(type);
    var isZodiacGroup = /肖/.test(type) && /(?:二|三|四|五|2|3|4|5)\s*(?:连)?肖/.test(type);
    // 组合玩法按“每一组”判断：整组中奖才整组标红，未中的组保持全黑。
    if (isNumberGroup || isZodiacGroup) {
        var cleaned = raw.replace(/[（(][^）)]*[）)]/g, ' ');
        var k = 3, need = 3;
        if (/二中二/.test(type)) { k = 2; need = 2; }
        else if (/三中二/.test(type)) { k = 3; need = 2; }
        else if (/四全中/.test(type)) { k = 4; need = 4; }
        else if (/二连肖|二肖连|2肖连/.test(type)) { k = 2; need = 2; }
        else if (/三连肖|三肖连|3肖连/.test(type)) { k = 3; need = 3; }
        else if (/四连肖|四肖连|4肖连/.test(type)) { k = 4; need = 4; }
        else if (/五连肖|五肖连|5肖连/.test(type)) { k = 5; need = 5; }
        var parts = cleaned.split(/(\s+)/);
        return parts.map(function(part){
            if (!part || /^\s+$/.test(part)) return escapeHtmlVerify(part);
            var nums = (part.match(/\d{1,2}/g) || []).map(Number).filter(function(n){ return n>=1 && n<=49; });
            var zods = extractZodiacsInOrder(part);
            var hit = false;
            if (isNumberGroup && nums.length >= k) hit = nums.filter(function(n){ return drawNums.has(n); }).length >= need;
            else if (isZodiacGroup && zods.length >= k) hit = zods.length === k && zods.every(function(z){ return drawZodiacs.has(z); });
            return hit ? '<span class="history-detail-token hit-token" style="color:#d32f2f;font-weight:700">' + escapeHtmlVerify(part) + '</span>' : '<span class="history-detail-token miss-token" style="color:#111">' + escapeHtmlVerify(part) + '</span>';
        }).join('');
    }
    var tokenRe = /\d{1,2}|[鼠牛虎兔龙蛇马羊猴鸡狗猪]/g;
    var out = '', last = 0, m;
    while ((m = tokenRe.exec(raw)) !== null){
        out += escapeHtmlVerify(raw.slice(last, m.index));
        var token = m[0], hit = /^\d+$/.test(token) ? drawNums.has(parseInt(token,10)) : drawZodiacs.has(token);
        out += '<span class="history-detail-token ' + (hit ? 'hit-token' : 'miss-token') + '" style="' + (hit ? 'color:#d32f2f;font-weight:700' : 'color:#111') + '">' + escapeHtmlVerify(token) + '</span>';
        last = m.index + token.length;
    }
    out += escapeHtmlVerify(raw.slice(last));
    return out;
}

function verifyDraw(){
    var tip = document.getElementById('verifyTip');
    tip.style.display = 'none';
    tip.textContent = '';
    var normalText = document.getElementById('drawNormal').value.trim();
    var specialText = document.getElementById('drawSpecial').value.trim();
    if (!normalText && !specialText) {
        tip.textContent = '请先输入开奖号码（平码 / 特码）';
        tip.style.display = 'block';
        return;
    }
    if (historyData.length === 0) {
        tip.textContent = '当前没有计算记录可验证，请先计算并加入明细';
        tip.style.display = 'block';
        return;
    }
    var normal = parseDrawNums(normalText);
    var specialArr = parseDrawNums(specialText);
    var special = specialArr.length ? specialArr[0] : null;
    if (normal.length > 0 && normal.length !== 6) {
        tip.textContent = '提示：平码通常为 6 个，当前输入 ' + normal.length + ' 个，仍按现有号码验证';
        tip.style.display = 'block';
    }
    var draw = { normal: normal, special: special };
    verifyStateBeforeLastRun = historyData.map(function(item){ return { id: item.id, verify: item.verify }; });
    historyData.forEach(function(item){ item.verify = verifyOneRecord(item, draw); });
    lastVerifyDraw = { normal: normal, special: special, time: getBeijingTimeString() };
    renderHistory();
    renderVerifySummary();
}

function renderVerifySummary(){
    var el = document.getElementById('verifySummary');
    if (!lastVerifyDraw || historyData.length === 0) {
        el.classList.remove('show');
        el.innerHTML = '';
        return;
    }
    var d = lastVerifyDraw;
    var colorClass = function (n) {
        var c = colorOf(n);
        if (c === '红') return 'red';
        if (c === '蓝') return 'blue';
        if (c === '绿') return 'green';
        return '';
    };
    var cHex = function (n) {
        var c = colorOf(n);
        if (c === '红') return '#d32f2f';
        if (c === '蓝') return '#1976d2';
        if (c === '绿') return '#2e7d32';
        return '';
    };
    var normalStr = d.normal.length
        ? d.normal.map(function (n) {
            var cc = colorClass(n);
            return '<span class="draw-num-col">'
                 + '<span class="draw-num ' + cc + '">' + pad(n) + '</span>'
                 + '<span class="draw-zodiac" style="color:' + cHex(n) + ';">' + (numToZodiac(n) || '') + '</span>'
                 + '</span>';
          }).join('')
        : '—';
    var specialStr = d.special !== null
        ? '<span class="draw-num ' + colorClass(d.special) + '">' + pad(d.special) + '</span>'
          + '<span style="color:' + cHex(d.special) + ';">（' + (numToZodiac(d.special) || '') + '/' + colorOf(d.special) + '波）</span>'
        : '—';
    var ODD_MAP_VERIFY = {
        '特码': 47, '号码': 47,
        '平特一肖': 2,
        '二中二': 60, '复式二中二': 60,
        '三中三': 600, '复式三中三': 600,
        '平特二连肖': 4, '复式二肖连': 4, '复式2肖连': 4,
        '平特三连肖': 10, '复式三肖连': 10, '复式3肖连': 10,
        '平特四连肖': 30, '复式四肖连': 30, '复式4肖连': 30,
        '平特五连肖': 100, '复式五肖连': 100, '复式5肖连': 100
    };
    var hitItems = 0;
    var hitAmount = 0;
    var missItems = 0;
    var unknownItems = 0;
    historyData.forEach(function(item){
        var v = item.verify;
        if (!v) return;
        if (v.status === 'hit') {
            hitItems++;
            var mm = v.label.match(/中\s*(\d+)\s*\/\s*\d+/);
            var mult = mm ? parseInt(mm[1], 10) : 1;
            if (!mm || !mult || mult < 1) mult = 1;
            var odd = ODD_MAP_VERIFY[item.type] || 1;
            hitAmount += item.unit * mult * odd;
        } else if (v.status === 'miss') {
            missItems++;
        } else {
            unknownItems++;
        }
    });
    var totalAmount = historyData.reduce(function(s, i){ return s + i.subtotal; }, 0);
    var fmtHit = Number.isInteger(hitAmount) ? hitAmount : parseFloat(hitAmount.toFixed(2));
    var fmtTotal = Number.isInteger(totalAmount) ? totalAmount : parseFloat(totalAmount.toFixed(2));
    var typeStats = {};
    historyData.forEach(function(item){
        var v = item.verify;
        if (v && v.status === 'hit') {
            var t = item.type || '其他';
            if (t === '号码') t = '特码';
            var mm2 = v.label.match(/中\s*(\d+)\s*\/\s*\d+/);
            var mult2 = mm2 ? parseInt(mm2[1], 10) : 1;
            if (!mm2 || !mult2 || mult2 < 1) mult2 = 1;
            var odd2 = ODD_MAP_VERIFY[item.type] || 1;
            if (!typeStats[t]) typeStats[t] = { principal: 0, odd: odd2, count: 0 };
            typeStats[t].principal += item.unit * mult2;
            typeStats[t].count += mult2;
        }
    });
    var typeOrder = ['特码','号码','二中二','复式二中二','三中二','三中三','四全中','复式三中三','二中特','特串','平特一肖','平特二连肖','平特三连肖','平特四连肖','平特五连肖','平特六连肖','复式二肖连','复式三肖连','复式四肖连','复式五肖连','正码一','正码二','正码三','正码四','正码五','正码六','正码','尾数','半波','0头','1头','2头','3头','4头','5不中','6不中','7不中','8不中','9不中','10不中'];
    var statHtml = '';
    var usedTypes = {};
    typeOrder.forEach(function(t){
        if (typeStats[t] !== undefined) {
            var s = typeStats[t];
            var winAmt = s.principal * s.odd;
            statHtml += '<div class="stat-line">' + t + '：<span class="hit-count">' + s.principal + '*' + s.odd + '=' + winAmt + '</span> 元</div>';
            usedTypes[t] = true;
        }
    });
    for (var tKey in typeStats) {
        if (Object.prototype.hasOwnProperty.call(typeStats, tKey) && !usedTypes[tKey]) {
            var s2 = typeStats[tKey];
            var winAmt2 = s2.principal * s2.odd;
            statHtml += '<div class="stat-line">' + tKey + '：<span class="hit-count">' + s2.principal + '*' + s2.odd + '=' + winAmt2 + '</span> 元</div>';
        }
    }
    var pnlTotal = totalAmount - hitAmount;
    var pnlSign = pnlTotal >= 0 ? '盈利' : '亏损';
    var pnlColor = pnlTotal >= 0 ? '#2e7d32' : '#c62828';
    el.innerHTML =
        '<div class="draw-line">开奖：平码 ' + normalStr + ' ｜ 特码 ' + specialStr + '</div>' +
        '<div>验证结果：共 ' + historyData.length + ' 项，中 <span class="hit-count">' + hitItems + '</span> 项，未中 ' + missItems + ' 项' +
        (unknownItems ? '，无法验证 ' + unknownItems + ' 项' : '') + '</div>' +
        '<div>中奖本金：<span class="hit-count">' + fmtHit + '</span> 元 ／ 总投注：' + fmtTotal + ' 元</div>' +
        '<div style="font-size:15px;font-weight:bold;color:'+pnlColor+';margin:6px 0;">'+pnlSign+' '+Math.abs(Math.round(pnlTotal*100)/100)+' 元</div>' +
        statHtml +
        '<div style="font-size:11px;color:#888;margin-top:8px;">验证时间：' + d.time + '</div>' +
        '<button onclick="closeVerifyResult()" style="margin-top:10px;padding:8px 20px;background:#666;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;">返回</button>';
    el.classList.add('show');
}

function closeVerifyResult(){
    // 返回到点击本次验证之前的状态，不清空计算明细或开奖号码输入框。
    if (verifyStateBeforeLastRun) {
        historyData.forEach(function(item){
            var prior = verifyStateBeforeLastRun.find(function(x){ return x.id === item.id; });
            if (prior && prior.verify) item.verify = prior.verify;
            else delete item.verify;
        });
    } else {
        historyData.forEach(function(item){ delete item.verify; });
    }
    verifyStateBeforeLastRun = null;
    lastVerifyDraw = null;
    var el = document.getElementById('verifySummary');
    if (el) { el.classList.remove('show'); el.innerHTML = ''; }
    var tip = document.getElementById('verifyTip');
    if (tip) { tip.style.display = 'none'; tip.textContent = ''; }
    renderHistory();
}

function copyVerifyResult(){
    if (!lastVerifyDraw) { alert('请先点击"验证开奖结果"'); return; }
    var d = lastVerifyDraw;
    var plain = '【开奖验证结果】\n';
    plain += '验证时间：' + d.time + '\n';
    plain += '平码：' + (d.normal.length ? d.normal.map(pad).join(' ') : '—') + '\n';
    plain += '特码：' + (d.special !== null ? pad(d.special) + '（' + (numToZodiac(d.special) || '') + '/' + colorOf(d.special) + '波）' : '—') + '\n';
    plain += '------------------------\n';
    var html = '<div><b>【开奖验证结果】</b><br>验证时间：' + escapeHtmlVerify(d.time) + '<br>平码：' + escapeHtmlVerify(d.normal.length ? d.normal.map(pad).join(' ') : '—') + '<br>特码：' + escapeHtmlVerify(d.special !== null ? pad(d.special) + '（' + (numToZodiac(d.special) || '') + '/' + colorOf(d.special) + '波）' : '—') + '<hr>';
    historyData.forEach(function(item, idx){
        var v = item.verify || { status: 'unknown', label: '未验证' };
        var detailHtml = renderVerifiedDetail(item);
        plain += (idx + 1) + '. [' + item.type + '] ' + item.detail + '\n';
        plain += '   ' + item.count + '注 × ' + item.unit + '元 = ' + item.subtotal + '元 → ' + v.label + '\n';
        html += '<div>' + (idx + 1) + '. [' + escapeHtmlVerify(item.type) + '] ' + detailHtml + '<br>' + item.count + '注 × ' + item.unit + '元 = ' + item.subtotal + '元 → ' + escapeHtmlVerify(v.label) + '</div>';
    });
    var hitItems = 0, hitAmount = 0;
    historyData.forEach(function(item){
        if (item.verify && item.verify.status === 'hit') {
            hitItems++;
            var mm3 = item.verify.label.match(/中\s*(\d+)\s*\/\s*\d+/);
            var mult3 = mm3 ? parseInt(mm3[1], 10) : 1;
            if (!mm3 || !mult3 || mult3 < 1) mult3 = 1;
            hitAmount += item.unit * mult3;
        }
    });
    var totalAmount = historyData.reduce(function(sum, item){ return sum + item.subtotal; }, 0);
    plain += '------------------------\n中奖：' + hitItems + ' 项，合计本金 ' + hitAmount + ' 元\n总投注：' + totalAmount + ' 元';
    html += '<hr>中奖：' + hitItems + ' 项，合计本金 ' + hitAmount + ' 元<br>总投注：' + totalAmount + ' 元</div>';
    if (navigator.clipboard && navigator.clipboard.write && typeof ClipboardItem !== 'undefined') {
        var blobHtml = new Blob([html], {type:'text/html'});
        var blobText = new Blob([plain], {type:'text/plain'});
        navigator.clipboard.write([new ClipboardItem({'text/html':blobHtml,'text/plain':blobText})])
            .then(function(){ showCopySuccess(); })
            .catch(function(){
                if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(plain).then(showCopySuccess).catch(function(){ fallbackCopy(plain); });
                else fallbackCopy(plain);
            });
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(plain).then(function(){ showCopySuccess(); }).catch(function(){ fallbackCopy(plain); });
    } else fallbackCopy(plain);
}


// ===== 独立补丁：特肖金额按每个生肖的全部号码总额平均分配 =====
// 仅识别明确写出“特肖”的格式；“各号/各数”仍交给原有逐号码计价逻辑。
function tryParseTeXiaoZodiacTotal(text){
    var lines = String(text || '').split(/[\r\n]+/).map(function(line){ return line.trim(); }).filter(Boolean);
    if (!lines.length) return null;
    var items = [];
    var amountRe = /([一二两三四五六七八九十百千零〇\d]+(?:\.\d+)?)\s*(?:米|块|元|块钱|快|闷|文|蚊|斤)?\s*$/;
    for (var i = 0; i < lines.length; i++){
        var line = lines[i].replace(/[。；;，,]+$/g, '').trim();
        if (!line) continue;
        if (/^(?:正确)?(?:玩法|结果|注数|金额|备注|注解)\s*[:：;；]/.test(line)) continue;
        if (!/^特肖/.test(line) || /各\s*(?:号|数|个号|个数)/.test(line)) return null;
        var am = line.match(amountRe);
        if (!am) return null;
        var amount = parseAmountCN(am[1]);
        if (amount === null || amount < 0) return null;
        var body = line.substring(0, am.index).replace(/^特肖/, '').replace(/[，,:：\s]/g, '').replace(/各$/, '');
        var zodiacs = extractZodiacsInOrder(body);
        var residue = body.replace(/[鼠牛虎兔龙蛇马羊猴鸡狗猪]/g, '');
        if (!zodiacs.length || residue) return null;
        for (var zi = 0; zi < zodiacs.length; zi++){
            var zodiac = zodiacs[zi];
            var numberCount = (ZODIAC[zodiac] || []).length;
            if (!numberCount) return null;
            items.push({
                type: '特码',
                count: numberCount,
                detail: '特肖' + zodiac + '（' + numberCount + '个号码均分）',
                unit: amount / numberCount,
                subtotal: amount
            });
        }
    }
    return items.length ? items.map(function(item){
        return { special: true, result: item, original: String(text || '').trim() };
    }) : null;
}

// ===== 独立补丁：剔除整行“正确玩法/玩法/正确结果”等说明文字，避免被误当投注 =====
// 保留投注正文；只过滤整行格式的结果说明，不触碰号码和金额解析。
var splitAtAmountBoundariesBeforeMetaPatch = splitAtAmountBoundaries;
splitAtAmountBoundaries = function(text){
    var source = String(text || '');
    var cleaned = source.split(/[\r\n]+/).filter(function(line){
        return !/^\s*(?:正确玩法[一二三四五六七八九十]?|正确结果[一二三四五六七八九十]?|正确金额|正确注数|玩法|结果|注数|金额|备注|注解)\s*[:：;；，,]/.test(line) && !(/^\s*[^0-9鼠牛虎兔龙蛇马羊猴鸡狗猪]*?(?:明白吗|明白了吗)\s*[！!。.]?\s*$/.test(line));
    }).join('\n');
    var specialTeXiao = tryParseTeXiaoZodiacTotal(cleaned);
    if (specialTeXiao) return [cleaned];
    return splitAtAmountBoundariesBeforeMetaPatch(cleaned);
};

// ===== 独立补丁：特肖专用入口 + 清除被金额切割遗留的孤立玩法标签 =====
// 原 splitIntoSegments 完整保留；新入口只在明确匹配时接管，否则原样回退。
var splitIntoSegmentsBeforeTeXiaoPatch = splitIntoSegments;
splitIntoSegments = function(text){
    var specialTeXiao = tryParseTeXiaoZodiacTotal(text);
    if (specialTeXiao) return specialTeXiao;
    var parsed = splitIntoSegmentsBeforeTeXiaoPatch(text);
    var hasRealBet = parsed.some(function(seg){ return seg && (seg.special || (seg.content && seg.content.trim())); });
    if (hasRealBet && /平特[二三四五2-5]连/.test(String(text || ''))){
        parsed = parsed.filter(function(seg){
            if (!seg || seg.special || !seg.content) return true;
            return !/^\s*平特[二三四五2-5]连\s*$/.test(seg.content);
        });
    }
    return parsed;
};


// ===== 独立补丁：新增第85-89组格式（原有解析函数与算法保持不变） =====
// 仅对完整匹配的新格式接管；任何不完整或不确定的文本均回退原解析流程。
function tryParseNewCases85to89(text){
    var source = String(text || '').trim();
    if (!source) return null;
    var lines = source.split(/[\r\n]+/).map(function(s){ return s.trim(); }).filter(Boolean);
    var results = [];
    var amountPattern = /([一二两三四五六七八九十百千零〇\d]+(?:\.\d+)?)\s*(?:元|米|块|块钱|快|闷|文|蚊|斤)?\s*$/;
    function amountOf(line){
        var m = line.match(amountPattern);
        if (!m) return null;
        var n = parseAmountCN(m[1]);
        return n === null || n < 0 ? null : n;
    }
    function numbersOf(line){
        var matches = line.match(/\d{1,2}/g) || [];
        var nums = matches.map(function(x){ return parseInt(x, 10); });
        if (!nums.length || nums.some(function(n){ return n < 1 || n > 49; })) return null;
        return nums;
    }
    function comb(n, k){
        if (n < k) return 0;
        var v = 1;
        for (var i = 1; i <= k; i++) v = v * (n - i + 1) / i;
        return Math.round(v);
    }
    function add(type, count, unit, detail){
        results.push({ special:true, result:{ type:type, count:count, detail:detail, unit:unit, subtotal:count*unit }, original:source });
    }
    function zodiacName(k){ return ({2:'二',3:'三',4:'四',5:'五',6:'六'})[k] || String(k); }

    // 第85/87组：同一号码组后面并列两种数字玩法，各按同一单价独立计算。
    if (lines.length === 1 && /各\s*[一二两三四五六七八九十百千零〇\d]+/.test(lines[0]) && /(?:复试|复式)?(?:二中二|三中二)/.test(lines[0]) && /三中三/.test(lines[0])){
        var line = lines[0];
        var amount = amountOf(line);
        var firstLabel = line.search(/(?:复试|复式)?(?:二中二|三中二)/);
        var nums = firstLabel >= 0 ? numbersOf(line.slice(0, firstLabel)) : null;
        if (amount !== null && nums){
            var isFu = /(?:复试|复式)\s*二中二/.test(line);
            var isSanEr = /三中二/.test(line);
            var count2 = isFu ? comb(nums.length, 2) : 1;
            var count3 = isSanEr ? 1 : (nums.length === 3 ? 1 : comb(nums.length, 3));
            if (count2 > 0 && count3 > 0){
                add(isFu ? '复式二中二' : (isSanEr ? '三中二' : '二中二'), count2, amount, nums.map(pad).join('-') + ' (独立玩法)');
                add(isFu ? '复式三中三' : '三中三', count3, amount, nums.map(pad).join('-') + ' (独立玩法)');
                return results;
            }
        }
    }

    // 第86组：同一组六个及以上生肖，同时指定复式四连/五连。
    if (lines.length === 1 && /(?:复试|复式)/.test(lines[0]) && /四连/.test(lines[0]) && /五连/.test(lines[0]) && /各/.test(lines[0])){
        var line86 = lines[0];
        var amount86 = amountOf(line86);
        var body86 = line86.slice(0, line86.search(/(?:复试|复式)/));
        body86 = body86.replace(/^(?:新澳门|新澳|澳门|澳|香港|香|门)[，。,.：:\s]*/, '');
        var z86 = extractZodiacsInOrder(body86);
        var residue86 = body86.replace(/[鼠牛虎兔龙蛇马羊猴鸡狗猪]/g, '').replace(/[\s，。,.、]/g, '');
        if (amount86 !== null && z86.length >= 5 && !residue86){
            add('复式四连肖', comb(z86.length, 4), amount86, z86.join('') + ' (' + z86.length + '选4)');
            add('复式五连肖', comb(z86.length, 5), amount86, z86.join('') + ' (' + z86.length + '选5)');
            return results;
        }
    }

    // 第88组：带“门/香”等前缀的三中三复式标题，号码在下一行，按组合数计算。
    if (lines.length >= 4 && lines.length % 2 === 0){
        var blocks88 = [];
        var ok88 = true;
        for (var i88 = 0; i88 < lines.length; i88 += 2){
            var head88 = lines[i88].replace(/^(?:新澳门|新澳|澳门|澳|香港|门|香)[，。,.：:\s]*/, '');
            if (!/三中三/.test(head88) || !/(?:复试|复式)/.test(head88)){ ok88 = false; break; }
            var data88 = lines[i88+1];
            var amt88 = amountOf(data88);
            var nums88 = numbersOf(data88.replace(/各\s*[一二两三四五六七八九十百千零〇\d]+.*$/, ''));
            if (amt88 === null || !nums88 || nums88.length < 3 || !/各/.test(data88)){ ok88 = false; break; }
            blocks88.push({ nums:nums88, amount:amt88 });
        }
        if (ok88 && blocks88.length >= 2){
            blocks88.forEach(function(b){ add('复式三中三', comb(b.nums.length, 3), b.amount, b.nums.map(pad).join(' ') + ' (' + b.nums.length + '选3)'); });
            return results;
        }
    }

    // 第89组：“四有/三有 + 对应数量生肖”表示一注平特连肖。
    if (lines.length >= 2){
        var blocks89 = [];
        var ok89 = true;
        lines.forEach(function(line89){
            var m89 = line89.match(/([二三四五六七八九十\d])有/);
            var amt89 = amountOf(line89);
            if (!m89 || amt89 === null){ ok89 = false; return; }
            var k89 = parseInt(m89[1], 10) || ({'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10})[m89[1]];
            var body89 = line89.slice(m89.index + m89[0].length, line89.length).replace(amountPattern, '');
            body89 = body89.replace(/^[，。,.：:=\s]+/, '');
            var z89 = extractZodiacsInOrder(body89);
            var residue89 = body89.replace(/[鼠牛虎兔龙蛇马羊猴鸡狗猪]/g, '').replace(/[\s，。,.、:=]/g, '');
            if (!k89 || z89.length !== k89 || residue89){ ok89 = false; return; }
            blocks89.push({ k:k89, z:z89, amount:amt89 });
        });
        if (ok89 && blocks89.length === lines.length){
            blocks89.forEach(function(b){ add('平特' + zodiacName(b.k) + '连肖', 1, b.amount, b.z.join('')); });
            return results;
        }
    }
    return null;
}

// 入口包装器：先尝试完整识别新增格式；未命中时原样调用旧函数。
var splitAtAmountBoundariesBeforeCases85to89 = splitAtAmountBoundaries;
splitAtAmountBoundaries = function(text){
    if (tryParseNewCases85to89(text)) return [String(text || '')];
    return splitAtAmountBoundariesBeforeCases85to89(text);
};
var splitIntoSegmentsBeforeCases85to89 = splitIntoSegments;
splitIntoSegments = function(text){
    var specialNewCases = tryParseNewCases85to89(text);
    if (specialNewCases) return specialNewCases;
    return splitIntoSegmentsBeforeCases85to89(text);
};



// ===== 独立补丁：新增第90-92组混合玩法识别（不改动既有解析函数） =====
// 仅当整段内容严格符合以下新格式时接管；否则完全回退此前解析流程。
function tryParseNewCases90to92(text){
    var source = String(text || '').trim();
    if (!source) return null;
    var lines = source.split(/[\r\n]+/).map(function(s){ return s.trim(); }).filter(Boolean);
    var results = [];
    var zodiacChars = '鼠牛虎兔龙蛇马羊猴鸡狗猪';
    var amountRe = /([一二两三四五六七八九十百千零〇\d]+(?:\.\d+)?)\s*(?:元|米|块|块钱|快|闷|文|蚊|斤)?\s*$/;

    function amountOf90(line){
        var m = line.match(amountRe);
        if (!m) return null;
        var n = parseAmountCN(m[1]);
        return n === null || n < 0 ? null : n;
    }
    function cleanNoise90(line){
        return String(line || '').replace(/^(?:新澳门|新澳|澳门|澳|香港|香|奥特|奥|澳特)\s*[，。,.：:\s]*/, '').trim();
    }
    function add90(type, count, unit, subtotal, detail){
        results.push({
            special:true,
            result:{ type:type, count:count, detail:detail, unit:unit, subtotal:subtotal },
            original:source
        });
    }
    function kName90(k){
        return ({2:'二',3:'三',4:'四',5:'五'})[k] || String(k);
    }

    // 通用补充：多个生肖组合在前，统一“k连各金额”在末尾，如第89组。
    // 只在每个组合都恰好包含k个生肖、且其余字符均为分隔符时接管。
    if (lines.length === 1){
        var line89 = cleanNoise90(lines[0]);
        var suffix89 = line89.match(/([二三四五2-5])\s*(?:连|联)\s*(?:肖)?\s*(?:各组|每组|一组|各|每)\s*([一二两三四五六七八九十百千零〇\d]+)\s*(?:元|米|块|块钱|快|闷|文|蚊|斤)?$/);
        if (suffix89){
            var map89 = {'二':2,'三':3,'四':4,'五':5,'2':2,'3':3,'4':4,'5':5};
            var k89 = map89[suffix89[1]], a89 = parseAmountCN(suffix89[2]);
            var body89 = line89.slice(0, suffix89.index).trim();
            var groupTexts89 = body89.split(/[，,；;、\s]+/).filter(Boolean);
            var groups89 = [];
            var valid89 = !!k89 && a89 !== null && groupTexts89.length >= 2;
            groupTexts89.forEach(function(part){
                var zs = extractZodiacsInOrder(part);
                var residue = part.replace(/[鼠牛虎兔龙蛇马羊猴鸡狗猪]/g, '');
                if (zs.length !== k89 || residue) valid89 = false;
                else groups89.push(zs);
            });
            if (valid89 && groups89.length === groupTexts89.length){
                add90('平特' + kName90(k89) + '连肖', groups89.length, a89, groups89.length * a89, groups89.map(function(z){ return z.join(''); }).join(' '));
                return results;
            }
        }
    }

    // 第90组：同一消息内分别出现“三联/二联”等玩法，联与连同义。
    var lines90 = lines.map(cleanNoise90).filter(function(line){
        return line && !/^(?:注|备注|注解)[:：;]/.test(line);
    });
    if (lines90.length >= 2 && lines90.every(function(line){
        return new RegExp('^[' + zodiacChars + ']{2,5}\\s*[二三四五2-5]\\s*(?:连|联)\\s*(?:肖)?\\s*(?:(?:各组|每组|一组|各|每)\\s*)?[一二两三四五六七八九十百千零〇\\d]+\\s*(?:元|米|块|块钱|快|闷|文|蚊|斤)?$').test(line);
    })){
        var parsed90 = [];
        var ok90 = true;
        lines90.forEach(function(line){
            var m = line.match(new RegExp('^([' + zodiacChars + ']{2,5})\\s*([二三四五2-5])\\s*(?:连|联)\\s*(?:肖)?\\s*(?:(?:各组|每组|一组|各|每)\\s*)?([一二两三四五六七八九十百千零〇\\d]+)\\s*(?:元|米|块|块钱|快|闷|文|蚊|斤)?$'));
            if (!m){ ok90 = false; return; }
            var kMap90 = {'二':2,'三':3,'四':4,'五':5,'2':2,'3':3,'4':4,'5':5};
            var k90 = kMap90[m[2]];
            var z90 = extractZodiacsInOrder(m[1]);
            var a90 = parseAmountCN(m[3]);
            if (!k90 || z90.length !== k90 || a90 === null){ ok90 = false; return; }
            parsed90.push({k:k90,z:z90,a:a90});
        });
        if (ok90 && parsed90.length === lines90.length){
            parsed90.forEach(function(b){ add90('平特' + kName90(b.k) + '连肖', 1, b.a, b.a, b.z.join('')); });
            return results;
        }
    }

    // 第91组：特码“号码+金额”与三中三标题/明细混合出现；香港等为噪音词。
    var useful91 = lines.map(cleanNoise90).filter(function(line){
        return line && !/^(?:注|备注|注解)[:：;]/.test(line);
    });
    var teMaLine91 = null, sanHeader91 = null, sanData91 = [];
    useful91.forEach(function(line){
        if (/^特码\s*[:：]/.test(line)) teMaLine91 = line.replace(/^特码\s*[:：]\s*/, '');
        else if (/三中三/.test(line) && /三组/.test(line) && /各/.test(line)) sanHeader91 = line;
        else if (/^\d{1,2}(?:\s*[.．、,，\/-]\s*\d{1,2}){2}(?:\s+\d{1,2}(?:\s*[.．、,，\/-]\s*\d{1,2}){2}){0,}$/.test(line)) sanData91.push(line);
        else { /* 其他内容不接管，确保只处理完整明确格式 */ }
    });
    if (teMaLine91 && sanHeader91 && sanData91.length === 1 && useful91.length === 3){
        // “24 十 12 五”中的“十”是号码分隔符，末尾“五”是该组金额；
        // 24与12合为一注特码，金额5元。
        var amountMatch91 = teMaLine91.match(amountRe);
        var teMaAmount91 = amountMatch91 ? parseAmountCN(amountMatch91[1]) : null;
        var teMaBody91 = amountMatch91 ? teMaLine91.slice(0, amountMatch91.index) : '';
        var teMaNums91 = teMaBody91.match(/\d{1,2}/g) || [];
        var teMaResidue91 = teMaBody91.replace(/\d{1,2}/g, '').replace(/[\s，,。；;、:：+＋十]/g, '');
        var amt91 = amountOf90(sanHeader91);
        var groups91 = [];
        var triples91 = sanData91[0].match(/\d{1,2}(?:\s*[.．、,，\/-]\s*\d{1,2}){2}/g) || [];
        triples91.forEach(function(g){ groups91.push((g.match(/\d{1,2}/g) || []).map(function(n){ return parseInt(n,10); })); });
        if (teMaAmount91 !== null && teMaNums91.length === 2 &&
            teMaNums91.every(function(n){ return parseInt(n,10) >= 1 && parseInt(n,10) <= 49; }) &&
            !teMaResidue91 && amt91 !== null && groups91.length === 3 &&
            groups91.every(function(g){ return g.length === 3 && g.every(function(n){ return n >= 1 && n <= 49; }); })){
            add90('特码', 1, teMaAmount91, teMaAmount91, teMaNums91.join('+'));
            add90('三中三', 3, amt91, 3 * amt91, groups91.map(function(g){ return g.map(pad).join('.'); }).join(' '));
            return results;
        }
    }

    // 第92组：同一消息中三连、四连、五连混合；四连金额标题与生肖组合分行。
    if (lines.length >= 4){
        var parsed92 = [];
        var pending92 = null;
        var ok92 = true;
        var sawThree92 = false, sawFour92 = false, sawFive92 = false;
        for (var i92 = 0; i92 < lines.length; i92++){
            var line92 = cleanNoise90(lines[i92]);
            if (!line92 || /^(?:注|备注|注解)[:：;]/.test(line92)) continue;
            var inline92 = line92.match(/^([二三四五2-5])\s*(?:连|联)\s*([鼠牛虎兔龙蛇马羊猴鸡狗猪]+)\s*([一二两三四五六七八九十百千零〇\d]+)\s*(?:元|米|块|块钱|快|闷|文|蚊|斤)?$/);
            if (inline92){
                var km92 = {'二':2,'三':3,'四':4,'五':5,'2':2,'3':3,'4':4,'5':5};
                var k92 = km92[inline92[1]], z92 = extractZodiacsInOrder(inline92[2]), a92 = parseAmountCN(inline92[3]);
                if (!k92 || z92.length !== k92 || a92 === null){ ok92 = false; break; }
                parsed92.push({k:k92,count:1,amount:a92,zodiacs:[z92]});
                if (k92 === 3) sawThree92 = true;
                if (k92 === 4) sawFour92 = true;
                if (k92 === 5) sawFive92 = true;
                continue;
            }
            var header92 = line92.match(/^([二三四五2-5])\s*(?:连|联)\s*(?:肖)?\s*(?:各组|每组|一组|各|每)\s*([一二两三四五六七八九十百千零〇\d]+)\s*(?:元|米|块|块钱|快|闷|文|蚊|斤)?$/);
            if (header92 && !pending92){
                var kh92 = km92[header92[1]], ah92 = parseAmountCN(header92[2]);
                if (!kh92 || ah92 === null){ ok92 = false; break; }
                pending92 = {k:kh92, amount:ah92};
                continue;
            }
            if (pending92){
                var chunks92 = line92.split(/\s+/).filter(Boolean);
                var groups92 = [];
                chunks92.forEach(function(chunk){
                    var zs92 = extractZodiacsInOrder(chunk);
                    var residue = chunk.replace(/[鼠牛虎兔龙蛇马羊猴鸡狗猪]/g, '').replace(/[，,。；;、\-~]/g, '');
                    if (zs92.length !== pending92.k || residue) groups92 = null;
                    else if (groups92) groups92.push(zs92);
                });
                if (!groups92 || !groups92.length){ ok92 = false; break; }
                parsed92.push({k:pending92.k,count:groups92.length,amount:pending92.amount,zodiacs:groups92});
                if (pending92.k === 3) sawThree92 = true;
                if (pending92.k === 4) sawFour92 = true;
                if (pending92.k === 5) sawFive92 = true;
                pending92 = null;
                continue;
            }
            ok92 = false;
            break;
        }
        if (ok92 && !pending92 && sawThree92 && sawFour92 && sawFive92 && parsed92.length === 3){
            parsed92.forEach(function(b){
                add90('平特' + kName90(b.k) + '连肖', b.count, b.amount, b.count * b.amount, b.zodiacs.map(function(z){ return z.join(''); }).join(' '));
            });
            return results;
        }
    }
    return null;
}

// 在第85-89组补丁之后追加包装；新规则未完整匹配时回退原有解析入口。
var splitAtAmountBoundariesBeforeCases90to92 = splitAtAmountBoundaries;
splitAtAmountBoundaries = function(text){
    if (tryParseNewCases90to92(text)) return [String(text || '')];
    return splitAtAmountBoundariesBeforeCases90to92(text);
};
var splitIntoSegmentsBeforeCases90to92 = splitIntoSegments;
splitIntoSegments = function(text){
    var parsed90to92 = tryParseNewCases90to92(text);
    if (parsed90to92) return parsed90to92;
    return splitIntoSegmentsBeforeCases90to92(text);
};

