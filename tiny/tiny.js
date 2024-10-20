function tiny_html(data) {
    data.use = null;
    let tail = data.source.substring(data.source.lastIndexOf('.'));
    if (data.act == 'file') { data.use = 'file' }
    else if (tiny_image.indexOf(tail) >= 0) { data.use = 'image' }
    else if (tiny_video.indexOf(tail) >= 0) { data.use = 'video' }
    else if (tiny_audio.indexOf(tail) >= 0) { data.use = 'audio' }
    switch (data.use) {
        case 'image':
            return '<p><img src="' + data.source + '" alt="' + (data.alt || '') + '" /></p>';
        case 'video':
            return '<p><video controls="controls"><source src="' + data.source + '" /></video></p>';
        case 'audio':
            return '<p><audio controls="controls"><source src="' + data.source + '" /></audio></p>';
        default:
            return '<p><a href="' + data.source + '" target="_blank">' + (data.alt || data.source) + '</a></p>';
    };
};
function tiny_recv(recv) {
    for (let obj of recv) {
        let tail = obj.name.substring(obj.name.lastIndexOf('.')).toLowerCase();
        let act;
        if (tiny_image_use.indexOf(tail) >= 0) { act = 'image' }
        else if (tiny_media_use.indexOf(tail) >= 0) { act = 'media' }
        else { act = 'file' }
        tiny_pool.push({
            act: act,
            now: "wait",
            source: obj,
            alt: obj.name
        });
        document.querySelector('#tiny_list').insertAdjacentHTML('afterbegin', '<div style="max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><a id="tiny_file_' + (tiny_pool.length - 1) + '" href="javascript:;" onclick="tiny_stop(' + (tiny_pool.length - 1) + ');">[等待]</a> [粘贴] ' + obj.name + '</div>');
        tiny_info('rest', 1);
    };
    tiny_deal(null);
};
function tiny_pick(call, what, meta) {
    let show;
    switch (meta.filetype) {
        case 'image': show = '图片', accept = tiny_image_use.join(','); break;
        case 'media': show = '媒体', accept = tiny_media_use.join(','); break;
        case 'file': show = '文件', accept = tiny_type.join(','); break;
        default: console.log('unknown_operation'); return;
    };
    tiny_butt.setAttribute('accept', accept);
    tiny_butt.setAttribute('type', 'file');
    tiny_butt.setAttribute('multiple', 'multiple');
    tiny_butt.onchange = function () {
        for (let obj of tiny_butt.files) {
            tiny_pool.push({
                act: meta.filetype,
                now: "wait",
                source: obj,
                alt: obj.name
            });
            document.querySelector('#tiny_list').insertAdjacentHTML('afterbegin', '<div style="max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><a id="tiny_file_' + (tiny_pool.length - 1) + '" href="javascript:;" onclick="tiny_stop(' + (tiny_pool.length - 1) + ');">[等待]</a> [' + show + '] ' + obj.name + '</div>');
        };
        if (tiny_butt.files.length == 1) { tiny_deal(tiny_pool.length - 1, call); }
        else { tinymce.activeEditor.windowManager.close(); tiny_deal(null); };
        tiny_info('rest', tiny_butt.files.length);
        tiny_butt.value = null;
    };
    if (!document.querySelector('#tiny_solo')) { document.querySelector('.tox-dialog__title').insertAdjacentHTML('beforeend', ' <a id="tiny_solo" href="javascript:;" style="cursor:pointer;"></a>'); };
    tiny_butt.click();
};
function tiny_deal(ikey, call) {
    if (ikey === null) {
        for (let key in tiny_pool) {
            if (!tiny_pool[key]) { continue; };
            if (tiny_pool[key].now == 'proc') { return; };
            if (tiny_pool[key].now == 'wait') { ikey = key; tiny_pool[ikey].now = 'proc'; break; }
        }
    }
    else { tiny_pool[ikey].now = 'solo'; };
    if (ikey === null) {
        if (tiny_into) {
            tinymce.activeEditor.selection.collapse();
            tinymce.activeEditor.insertContent(tiny_into);
            tiny_into = '';
        };
        return;
    };
    if (tiny_jimg && tiny_pool[ikey].act == 'image') {
        new Jimg(tiny_pool[ikey].source, tiny_jimg).conv()
            .then((res) => { tiny_pool[ikey].alt = (tiny_pool[ikey].alt.substring(0, tiny_pool[ikey].alt.lastIndexOf('.')) || 'jimg') + '.' + res.canvas.type.substring(res.canvas.type.lastIndexOf('/') + 1); tiny_auth(res.canvas, ikey, call); })
            .catch((err) => { tiny_fail({ "warn": "jimg" }, ikey, (tiny_pool[ikey].now == 'solo')); console.log('Jimg:' + err); });
    }
    else { tiny_auth(tiny_pool[ikey].source, ikey, call); };
};
function tiny_auth(file, ikey, call) {
    let solo = (tiny_pool[ikey].now == 'solo');
    if (!tiny_size) { tiny_fail({ "warn": "auth" }, ikey, solo); return; };
    if (file.size < 12) { tiny_fail({ "warn": "file" }, ikey, solo); return; };
    if (file.size > tiny_size) { tiny_fail({ "warn": "size" }, ikey, solo); return; };
    let tail = tiny_pool[ikey].alt.substring(tiny_pool[ikey].alt.lastIndexOf('.')).toLowerCase();
    switch (tiny_pool[ikey].act) {
        case 'image': if (tiny_image_use.indexOf(tail) < 0) { tiny_fail({ "warn": "type" }, ikey, solo); return; }; break;
        case 'media': if (tiny_media_use.indexOf(tail) < 0) { tiny_fail({ "warn": "type" }, ikey, solo); return; }; break;
        default: if (tiny_type.indexOf(tail) < 0) { tiny_fail({ "warn": "type" }, ikey, solo); return; }; break;
    };
    let rqst = new XMLHttpRequest();
    rqst.open('POST', './?tiny_auth', true);
    rqst.onerror = function (e) { tiny_fail({ "warn": "rqst" }, ikey, solo, call); };
    rqst.onreadystatechange = function (e) {
        if (this.readyState === 4 && this.status === 200) {
            let json = JSON.parse(this.responseText);
            if (json['warn'] == 'done') { tiny_save(file, ikey, call); }
            else { tiny_fail(json, ikey, solo, call); };
        };
    };
    rqst.send(null);
};
function tiny_save(file, ikey, call) {
    let solo = (tiny_pool[ikey].now == 'solo');
    let rqst = new XMLHttpRequest();
    tiny_pool[ikey].xhr = rqst;
    rqst.open('POST', './?tiny_save', true);
    rqst.onerror = function (e) { tiny_fail({ "warn": "rqst" }, ikey, solo); };
    rqst.upload.onprogress = function (e) {
        if (!e.lengthComputable) { return; };
        let prog = parseInt(99 * e.loaded / e.total) + '%';
        if (solo && document.querySelector('#tiny_solo')) {
            document.querySelector('#tiny_solo').innerHTML = '<span style="color:darkorange;">[' + prog + ']</span>';
            document.querySelector('#tiny_solo').setAttribute('onclick', 'tiny_stop(' + ikey + ');')
        };
        document.querySelector('#tiny_file_' + ikey).innerHTML = '<span style="color:darkorange;">[' + prog + ']</span>';
        tiny_proc(false);
    };
    rqst.onreadystatechange = function (e) {
        if (this.readyState === 4 && this.status === 200) {
            delete tiny_pool[ikey].xhr;
            let json = JSON.parse(this.responseText);
            if (json['warn'] == 'done') { tiny_done(json, ikey, solo, call); }
            else { tiny_fail(json, ikey, solo); }
        }
    };
    let data = new FormData();
    data.append('filesize', file.size);
    data.append('file', file.name ? file : new File([file], tiny_pool[ikey].alt));
    data.append('filename', tiny_pool[ikey].alt);
    rqst.send(data);
};
function tiny_done(json, ikey, solo, call) {
    tiny_pool[ikey].now = 'done';
    tiny_pool[ikey].source = 'upload/attach/' + json['date'] + '/' + json['user'] + '_' + json['time'] + '.' + json['type'];
    tiny_pool[ikey].alt = tiny_pool[ikey].alt;
    if (solo && document.querySelector('#tiny_solo')) {
        document.querySelector('#tiny_solo').innerHTML = '<span style="color:green;">[完成]</span>';
        document.querySelector('#tiny_solo').removeAttribute('onclick');
        if (call) {
            call(tiny_pool[ikey].source, {
                text: tiny_pool[ikey].alt,
                alt: tiny_pool[ikey].alt
            })
        }
    } else {
        tiny_into += tiny_html({
            act: tiny_pool[ikey].act,
            source: tiny_pool[ikey].source,
            text: tiny_pool[ikey].alt,
            alt: tiny_pool[ikey].alt
        })
    };
    document.querySelector('#tiny_file_' + ikey).innerHTML = '<span style="color:green;">[完成]</span>';
    document.querySelector('#tiny_file_' + ikey).setAttribute('onclick', 'tiny_exec(' + ikey + ');');
    tiny_info('done', 1);
    tiny_proc(true);
    if (!solo) { tiny_deal(null); };
};
function tiny_fail(json, ikey, solo) {
    tiny_pool[ikey].now = json['warn'];
    if (solo && document.querySelector('#tiny_solo')) {
        document.querySelector('#tiny_solo').innerHTML = '<span style="color:red;">[错误]</span>';
        document.querySelector('#tiny_solo').setAttribute('onclick', 'tiny_exec(' + ikey + ');');
    };
    delete tiny_pool[ikey].source;
    document.querySelector('#tiny_file_' + ikey).innerHTML = '<span style="color:red;">[错误]</span>';
    document.querySelector('#tiny_file_' + ikey).setAttribute('onclick', 'tiny_exec(' + ikey + ');');
    tiny_info('fail', 1);
    tiny_proc(true);
    if (!solo) { tiny_deal(null); };
};
function tiny_stop(ikey) {
    tinymce.activeEditor.windowManager.confirm((ikey === null) ? '停止队列？' : '删除任务？',
        function (yes) {
            if (!yes) {
                return
            };
            if (ikey === null) {
                for (let key in tiny_pool) {
                    if (!tiny_pool[key].xhr) { continue; };
                    tiny_pool[key].xhr.abort();
                    delete tiny_pool[key].xhr;
                    tiny_pool[key].now = 'wait';
                    document.querySelector('#tiny_file_' + key).innerHTML = '<span style="color:blue;">[等待]</span>'
                };
                tiny_proc(true)
            } else {
                let proc = false;
                if (tiny_pool[ikey].xhr) {
                    if (tiny_pool[ikey].now == 'proc') { proc = true; };
                    tiny_pool[ikey].xhr.abort()
                };
                delete tiny_pool[ikey];
                tiny_info('rest', -1);
                document.querySelector('#tiny_file_' + ikey).parentNode.innerHTML = '';
                if (document.querySelector('#tiny_solo')) {
                    document.querySelector('#tiny_solo').innerHTML = '';
                    document.querySelector('#tiny_solo').removeAttribute('onclick')
                };
                tiny_proc(true);
                if (proc) { tiny_deal(null); }
            }
        })
};
function tiny_exec(ikey) {
    switch (tiny_pool[ikey].now) {
        case 'done':
            tinymce.activeEditor.selection.collapse();
            tinymce.activeEditor.insertContent(tiny_html({
                act: tiny_pool[ikey].act,
                source: tiny_pool[ikey].source,
                text: tiny_pool[ikey].alt,
                alt: tiny_pool[ikey].alt
            }));
            break;
        case 'auth': tinymce.activeEditor.windowManager.alert('无权上传文件'); break;
        case 'over': tinymce.activeEditor.windowManager.alert('周期配额用尽'); break;
        case 'file': tinymce.activeEditor.windowManager.alert('文件上传出错'); break;
        case 'size': tinymce.activeEditor.windowManager.alert('文件大小超限'); break;
        case 'type': tinymce.activeEditor.windowManager.alert('文件类型禁止'); break;
        case 'data': tinymce.activeEditor.windowManager.alert('数据存取失败'); break;
        case 'path': tinymce.activeEditor.windowManager.alert('目录创建失败'); break;
        case 'move': tinymce.activeEditor.windowManager.alert('文件存储失败'); break;
        case 'rqst': tinymce.activeEditor.windowManager.alert('网络请求失败'); break;
        case 'jimg': tinymce.activeEditor.windowManager.alert('前端处理失败'); break;
        default: tinymce.activeEditor.windowManager.alert('未知错误'); break;
    }
};
function tiny_info(mode, qnty) {
    document.querySelector('#tiny_info_' + mode).innerHTML = parseInt(document.querySelector('#tiny_info_' + mode).innerHTML) + qnty;
    if (mode != 'rest') { tiny_info('rest', -1); }
};
function tiny_proc(stop) {
    document.querySelector('#tiny_proc').innerHTML = stop ? '开始' : '停止';
    document.querySelector('#tiny_proc').setAttribute('onclick', stop ? 'tiny_deal(null);' : 'tiny_stop(null);');
};
function tiny_init(core, lang, conf) {
    let item = document.createElement("script");
    item.src = core;
    item.onload = function () {
        tinymce.init(Object.assign({
            language_url: lang,
            language: 'zh_CN',
            height: 400,
            selector: '#message',
            plugins: 'advlist code codesample image link lists media table wordcount',
            toolbar: 'bold italic underline strikethrough forecolor backcolor fontsize image media link unlink codesample hr styles numlist bullist table removeformat',
            content_style: '*{max-width:100% !important;}body{color:#333 !important;font-size:15px !important;}img{height:auto !important;}',
            font_size_formats: '12px 14px 15px 16px 18px 36px 72px',
            resize: true,
            menubar: false,
            branding: false,
            contextmenu: false,
            elementpath: false,
            smart_paste: false,
            text_patterns: false,
            allow_script_urls: true,
            link_default_target: '_blank',
            paste_postprocess: function (plugin, args) { for (let row of args.node.getElementsByTagName("a")) { row.target = "_blank"; } },
            file_picker_types: tiny_size ? ((tiny_image_use.length ? 'image ' : '') + (tiny_media_use.length ? 'media ' : '') + (tiny_type.length ? 'file ' : '')) : '' + 'ass',
            file_picker_callback: tiny_pick,
            image_uploadtab: false,
            media_alt_source: false,
            media_poster: false,
            media_url_resolver: (data, resolve) => {
                let u;
                let t;
                let ixigua = data.url.match(/^https?:\/\/(?:www|m)\.ixigua\.com\/(?:video\/)?(\d+)/i);
                let douyin = data.url.match(/^https?:\/\/(?:www|m)\.(?:ies)?douyin\.com\/(?:share\/)?video\/(\d+)/i);
                let acfun = data.url.match(/^https?:\/\/www\.acfun\.cn\/v\/ac(\d+)/i);
                let acfun_m = data.url.match(/^https?:\/\/m\.acfun\.cn\/v\/\?ac=(\d+)/i);
                let bv = data.url.match(/^BV(\w+)/i);
                let bilibili = data.url.match(/^https?:\/\/(?:www|m)\.bilibili\.com\/video\/BV(\w+)/i);
                let bilibili_av = data.url.match(/^https?:\/\/(?:www|m)\.bilibili\.com\/video\/av(\w+)/i);
                let youku = data.url.match(/^https?:\/\/(?:v|m)\.youku\.com\/(?:v_show|video)\/id_([\w\-\=]+)/i);
                let sohu = data.url.match(/^https?:\/\/tv\.sohu\.com\/v\/([\w\-\=]+)\.html(?:\?vid=(\d+))?/i);
                let sohu_m = data.url.match(/^https?:\/\/m\.tv\.sohu\.com\/u\/vw\/([\d]+)/i);
                let qq = data.url.match(/^https?:\/\/v\.qq\.com\/x\/(?:cover|page)\/.*?(\w+)\.html/i);
                let qq_m = data.url.match(/^https?:\/\/m\.v\.qq\.com\/.*?vid=(\w+)/i);
                let music163_0 = data.url.match(/^https?:\/\/(?:y\.)?music\.163\.com\/(?:m|\#)\/playlist\?id=(\d+)/i);
                let music163_1 = data.url.match(/^https?:\/\/(?:y\.)?music\.163\.com\/(?:m|\#)\/album\?id=(\d+)/i);
                let music163_2 = data.url.match(/^https?:\/\/(?:y\.)?music\.163\.com\/(?:m|\#)\/song\?id=(\d+)/i);
                if (ixigua) { u = 'https://www.ixigua.com/iframe/' + ixigua[1]; }
                else if (douyin) { u = 'https://www.douyin.com/light/' + douyin[1]; }
                else if (acfun) { u = 'https://www.acfun.cn/player/ac' + acfun[1]; }
                else if (acfun_m) { u = 'https://www.acfun.cn/player/ac' + acfun_m[1]; }
                else if (bv) { u = 'https://player.bilibili.com/player.html?bvid=BV' + bv[1]; }
                else if (bilibili) { u = 'https://player.bilibili.com/player.html?bvid=BV' + bilibili[1]; }
                else if (bilibili_av) { u = 'https://player.bilibili.com/player.html?aid=' + bilibili_av[1]; }
                else if (youku) { u = 'https://player.youku.com/embed/' + youku[1]; }
                else if (sohu) {
                    let bid = atob(sohu[1]).match(/^us\/\d+\/(\d+)/i);
                    if (bid) { u = 'https://tv.sohu.com/s/sohuplayer/iplay.html?bid=' + bid[1]; }
                    else if (sohu[2]) { u = 'https://tv.sohu.com/s/sohuplayer/iplay.html?vid=' + sohu[2]; }
                }
                else if (sohu_m) { u = 'https://tv.sohu.com/s/sohuplayer/iplay.html?bid=' + sohu_m[1]; }
                else if (qq) { u = 'https://v.qq.com/txp/iframe/player.html?vid=' + qq[1]; }
                else if (qq_m) { u = 'https://v.qq.com/txp/iframe/player.html?vid=' + qq_m[1]; }
                else if (music163_0) { u = 'https://music.163.com/outchain/player?type=0&id=' + music163_0[1]; t = 'm'; }
                else if (music163_1) { u = 'https://music.163.com/outchain/player?type=1&id=' + music163_1[1]; t = 'm'; }
                else if (music163_2) { u = 'https://music.163.com/outchain/player?type=2&id=' + music163_2[1]; t = 'a'; }
                if (u && !t) { t = 'v'; }
                switch (t) {
                    case 'v':
                        resolve({ html: '<iframe src="' + u + '" width="680" height="460"></iframe>' }); break;
                    case 'm':
                        resolve({ html: '<iframe src="' + u + '" width="400" height="600"></iframe>' }); break;
                    case 'a':
                        resolve({ html: '<iframe src="' + u + '" width="400"></iframe>' }); break;
                    default:
                        resolve({ html: '' }); break;
                }
            },
            video_template_callback: tiny_html,
            audio_template_callback: tiny_html,
            setup: function (editor) {
                editor.on('drop', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
                editor.on('input', () => {
                    editor.save();
                });
                editor.on('change', () => {
                    editor.save();
                });
                editor.on('paste', (e) => {
                    if (!e.clipboardData.files || !e.clipboardData.files.length) { return; };
                    e.preventDefault();
                    e.stopPropagation();
                    tiny_recv(e.clipboardData.files);
                });
                editor.on('keydown', (e) => {
                    if (!e.ctrlKey || e.keyCode != 13) { return; };
                    e.preventDefault();
                    e.stopPropagation();
                    document.getElementById('submit').click();
                });
                editor.on('load', () => {
                    document.querySelectorAll('.tox-editor-header').forEach(dom => dom.style.padding = 0);
                    document.querySelector('input[name="doctype"]').value = 0;
                    if (!document.querySelector('#tiny_info')) {
                        document.querySelector('.tox-statusbar__text-container').insertAdjacentHTML('afterbegin', '<span id="tiny_info" style="display:flex;flex:1 1 auto;"><a href="javascript:;" onclick="document.querySelector(\'#tiny_list\').style.display=(document.querySelector(\'#tiny_list\').style.display==\'none\')?\'\':\'none\';"><span id="tiny_info_rest" style="color:blue;">0</span>&nbsp;/&nbsp;<span id="tiny_info_done" style="color:green;">0</span>&nbsp;/&nbsp;<span id="tiny_info_fail" style="color:red;">0</span></a>&nbsp;&nbsp;<a id="tiny_proc" href="javascript:;" style="color:darkorange;"></a></span><span style="display:flex;flex:0 0 auto;"><a href="javascript:;" onclick="tinymce.activeEditor.undoManager.undo();" style="text-decoration:none">&nbsp;&nbsp;&#x276E;&#xFE0E;&nbsp;&nbsp;</a><a href="javascript:;" onclick="tinymce.activeEditor.undoManager.redo();" style="text-decoration:none">&nbsp;&nbsp;&#x276F;&#xFE0E;&nbsp;&nbsp;</a>');
                    };
                    if (!document.querySelector('#tiny_list')) {
                        document.querySelector('.tox-tinymce').insertAdjacentHTML('afterend', '<div id="tiny_list" style="margin-top:-1px;padding:2px 8px;border:1px solid #ccc;background:#FFF;color:rgba(34,47,62,.7);font-size:12px;max-height:112px;overflow-y:scroll;display:none;"></div>');
                    };
                    let stail = document.styleSheets[document.styleSheets.length - 1];
                    stail.insertRule('body img[style*="visibility: hidden"]:last-child {max-width:none !important;}', stail.cssRules.length - 1);
                });
                editor.on('ExecCommand', (e) => {
                    if (e.command === 'mceMedia') {
                        document.querySelector('.tox-dialog__body-nav').style.display = 'none';
                    };
                });
            }
        }, conf));
    };
    document.body.appendChild(item);
};
let tiny_image = ['.gif', '.jpg', '.jpeg', '.jpe', '.jif', '.jfif', '.png', '.bmp', '.dib', '.ico', '.cur', '.webp', '.heif', '.heic', '.avif', '.tiff', '.svg', '.eps', '.psd'];
let tiny_video = ['.mp4', '.m4v', '.mp4v', '.wmv', '.mov', '.qtm', '.qt', '.ogv', '.webm', '.hevc', '.av1'];
let tiny_audio = ['.m4a', '.mp4a', '.wma', '.aac', '.adts', '.oga', '.weba', '.wav', '.mp3', '.flac'];
let tiny_image_use = tiny_image.filter(function (val) { return tiny_type.indexOf(val) >= 0; });
let tiny_media_use = tiny_video.concat(tiny_audio).filter(function (val) { return tiny_type.indexOf(val) >= 0; });
let tiny_butt = document.createElement('input');
let tiny_pool = [];
let tiny_into = '';
let UM = { getEditor: function (func) { if (func != 'message') { return; }; return { setContent: function (html) { tinymce.activeEditor.insertContent(html); }, execCommand: function (cmd, html) { if (cmd != 'insertHtml') { return; }; tinymce.activeEditor.insertContent(html); } }; } };
class Jimg {
    constructor(file, conf) {
        this._ = '20221108';
        this.canvas = file || null;
        this.config = conf || {};
    };
    code(part, exec) {
        if (typeof (exec) == 'undefined') { return [...new Uint8Array(part)].map(b => b.toString(16).padStart(2, '0')).join(''); }
        else if (exec) { let temp = ''; while (part.length > 2) { temp += part.slice(-2); part = part.slice(0, -2); }; return temp + part; }
        else { return part; };
    };
    read(from, till) {
        return new Promise((resolve, reject) => {
            if (typeof (this.canvas) == 'object') {
                this.length = this.canvas.size;
                if (this.length < 60) { return reject('read:length'); };
                if (!from || from < 0) { from = from ? (this.length + from) : 0; };
                if (!till || till < 0) { till = this.length + (till || 0); };
                if (till > this.length) { till = this.length; };
                this.reader = this.reader || new FileReader();
                this.reader.readAsArrayBuffer(this.canvas.slice(from, till));
                this.reader.onerror = () => { return reject('read:error'); };
                this.reader.onload = () => { return resolve(this.code(this.reader.result)); };
            }
            else if (typeof (this.canvas) == 'string' && this.canvas.slice(0, 4) == 'blob') {
                if (this.reader) {
                    if (!from || from < 0) { from = from ? (this.length + from) : 0; };
                    if (!till || till < 0) { till = this.length + (till || 0); };
                    if (till > this.length) { till = this.length; };
                    return resolve(this.code(this.reader.response.slice(from, till)));
                }
                else {
                    this.reader = new XMLHttpRequest;
                    this.reader.responseType = 'arraybuffer';
                    this.reader.onerror = () => { return reject('read:error'); };
                    this.reader.onload = () => {
                        this.length = this.reader.response.byteLength;
                        if (this.length < 60) { return reject('read:length'); };
                        if (!from || from < 0) { from = from ? (this.length + from) : 0; };
                        if (!till || till < 0) { till = this.length + (till || 0); };
                        if (till > this.length) { till = this.length; };
                        return resolve(this.code(this.reader.response.slice(from, till)));
                    };
                    this.reader.open('GET', this.canvas);
                    this.reader.send(null);
                };
            }
            else if (typeof (this.canvas) == 'string' && this.canvas.slice(0, 4) == 'data') {
                let head = this.canvas.indexOf(',') + 1; if (head <= 0) { return reject('read:error'); };
                this.length = (this.canvas.length - head) * 0.75 - (this.canvas.slice(-2).match(/=/g) || []).length;
                if (this.length < 60) { return reject('read:length'); };
                if (!from || from < 0) { from = from ? (this.length + from) : 0; };
                if (!till || till < 0) { till = this.length + (till || 0); };
                if (till > this.length) { till = this.length; };
                return resolve(this.code(Uint8Array.from(atob(this.canvas.slice(head + Math.floor(from / 3) * 4, head + Math.ceil(till / 3) * 4)), c => c.charCodeAt(0)).buffer.slice(from % 3, (till % 3 || 3) - 3 || this.length)));
            }
            else { return reject('read:input'); };
        });
    };
    load(item) {
        return new Promise((resolve, reject) => {
            let loader = new Image();
            loader.src = (typeof (item) == 'object') ? URL.createObjectURL(item) : item;
            loader.onload = () => { return resolve(loader); };
            loader.onerror = () => { return reject('load:error'); };
        });
    };
    bath() {
        return new Promise((resolve, reject) => {
            if (typeof (this.canvas) == 'object' && this.config._dataurl) {
                let reader = new FileReader();
                reader.readAsDataURL(this.canvas);
                reader.onerror = () => { return reject('bath:error'); };
                reader.onload = () => { this.canvas = reader.result; return resolve(); };
            }
            else if (typeof (this.canvas) == 'string' && (this.canvas.slice(0, 4) == 'blob' || !this.config._dataurl)) {
                let reader = new XMLHttpRequest;
                reader.responseType = 'blob';
                reader.onerror = () => { return reject('bath:error'); };
                reader.onload = () => {
                    if (!this.config._dataurl) { this.canvas = reader.response; return resolve(); };
                    let _reader = new FileReader();
                    _reader.readAsDataURL(reader.response);
                    _reader.onerror = () => { return reject('bath:error'); };
                    _reader.onload = () => { this.canvas = _reader.result; return resolve(); };
                };
                reader.open('GET', this.canvas);
                reader.send(null);
            }
            else { return resolve(); };
        });
    };
    async init() {
        if (!this.canvas) { return Promise.reject('init:canvas'); };
        let head = await this.read(0, 41);
        if (head.slice(0, 16) == '89504e470d0a1a0a') { this.format = 'png'; if (head.slice(74, 82) == '6163544c') { this.animate = true; }; }
        else if (head.slice(0, 6) == 'ffd8ff') { this.format = 'jpg'; }
        else if (head.slice(0, 4) == '424d') { this.format = 'bmp'; }
        else if (head.slice(0, 8) == '00000100') { this.format = 'ico'; }
        else if (head.slice(0, 8) == '00000200') { this.format = 'ico'; this.detail = 'cur'; }
        else if (head.slice(0, 12) == '474946383761') { this.format = 'gif'; this.detail = 'gif87'; }
        else if (head.slice(0, 12) == '474946383961') { this.format = 'gif'; this.detail = 'gif89'; }
        else if (head.slice(0, 8) == '52494646' && head.slice(16, 24) == '57454250') { this.format = 'webp'; if (head.slice(24, 32) == '56503858' && parseInt(head.slice(40, 42), 16).toString(2).slice(-2, -1) == 1) { this.animate = true; }; }
        else { return Promise.reject('init:format'); };
        if (this.format == 'jpg') {
            let skip = 0; switch (head.slice(4, 8)) { case 'ffe0': skip = parseInt(head.slice(8, 12), 16) + 8; break; case 'ffe1': skip = 6; break; };
            if (skip) {
                let chip = ((skip * 2 + 28) > head.length) ? await this.read(skip, skip + 14) : head.slice(skip * 2, skip * 2 + 28);
                if (chip.slice(0, 8) == '45786966') {
                    let lend = (chip.slice(12, 16) == '4949'); skip += parseInt(this.code(chip.slice(20, 28), lend), 16) + 6;
                    chip = ((skip * 2 + 4) > head.length) ? await this.read(skip, skip + 2) : head.slice(skip * 2, skip * 2 + 4);
                    let loop = parseInt(this.code(chip, lend), 16); skip += 2;
                    chip = await this.read(skip, skip + loop * 12);
                    for (let i = 0; i < loop; i++) { if (['0112', '1201'].indexOf(chip.slice(i * 24, i * 24 + 4)) >= 0) { this.rotate = parseInt(this.code(chip.slice(i * 24 + 16, i * 24 + 20), lend), 16); break; }; };
                };
            };
        };
        if (this.format == 'gif' && this.detail == 'gif89') {
            let from = 0, find = 0;
            while (from >= 0 && find < 2) {
                find += ((await this.read(from, from + 102420)).match(/21f904.{8}00(2c|21)/g) || []).length;
                if (from + 102420 >= this.length) { from = -1; } else { from += 102400; };
            };
            if (find >= 2) { this.animate = true; };
        };
        if (this.reader) { delete this.reader; };
        return Promise.resolve(this);
    };
    async conv() {
        await this.init();
        if (!this.config[this.format]) { await this.bath(); return Promise.resolve(this); };
        let cfg = this.config[this.format].normal ? this.config[this.config[this.format].normal] : {};
        if (this.animate && typeof (this.config[this.format].animate) != 'undefined') {
            if (this.config[this.format].animate) { cfg = this.config[this.config[this.format].animate]; }
            else { await this.bath(); return Promise.resolve(this); };
        };
        if (cfg.format == 'image/webp' && typeof (this.config[this.format].nowebp) != 'undefined') {
            let cvs = document.createElement('canvas'); cvs.getContext('2d');
            if (cvs.toDataURL('image/webp').indexOf('data:image/webp') != 0) {
                if (this.config[this.format].nowebp) { cfg = this.config[this.config[this.format].nowebp]; }
                else { await this.bath(); return Promise.resolve(this); };
            };
        };
        let img = await this.load(this.canvas);
        let fix = (typeof (img.style['image-orientation']) == 'undefined') ? true : (['', 'from-image'].indexOf(img.style['image-orientation']) < 0);
        if (typeof (this.canvas) == 'object') { URL.revokeObjectURL(img.src); };
        let w = img.width, h = img.height, r = w / h, swap = false;
        if (fix && (this.rotate == 6 || this.rotate == 8)) { w = img.height; h = img.width; r = w / h; swap = true; };
        if (cfg.width && w > cfg.width && cfg.height && h > cfg.height) { if (cfg.height > cfg.width / r) { w = cfg.width; h = w / r; } else { h = cfg.height; w = h * r; }; }
        else if (cfg.width && w > cfg.width) { w = cfg.width; h = Math.round(w / r); }
        else if (cfg.height && h > cfg.height) { h = cfg.height; w = Math.round(h * r); };
        this.canvas = document.createElement('canvas');
        this.canvas.width = w;
        this.canvas.height = h;
        let ctx = this.canvas.getContext('2d');
        if (fix) {
            switch (this.rotate) {
                case 3: ctx.translate(w, h); ctx.rotate(Math.PI); break;
                case 6: ctx.translate(w, 0); ctx.rotate(Math.PI / 2); break;
                case 8: ctx.translate(0, h); ctx.rotate(Math.PI / -2); break;
            };
        };
        ctx.fillStyle = cfg.fill || 'transparent';
        ctx.fillRect(0, 0, w, h);
        if (cfg.render) { for (let key in cfg.render) { ctx[key] = cfg.render[key]; }; };
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, swap ? h : w, swap ? w : h);
        if (this.config._chop && this.config._chop.url) {
            let wmk = await this.load(this.config._chop.url), width = this.config._chop.width || 0, height = this.config._chop.height || 0, x = this.config._chop.x || 0, y = this.config._chop.y || 0;
            if (x > 0 && x < 1) { x = w * x - wmk.width / 2; };
            if (y > 0 && y < 1) { y = h * y - wmk.height / 2; };
            if (w >= width && h >= height) { ctx.drawImage(wmk, 0, 0, wmk.width, wmk.height, (x < 0) ? (w + x) : x, (y < 0) ? (h + y) : y, wmk.width, wmk.height); };
        };
        if (this.config._dataurl) { this.canvas = this.canvas.toDataURL(cfg.format || 'image/png', cfg.quality || 0.9); return Promise.resolve(this); }
        else {
            this.canvas = await new Promise((resolve, reject) => {
                try { this.canvas.toBlob(function (blob) { resolve(blob); }, cfg.format || 'image/png', cfg.quality || 0.9); }
                catch (e) { console.log(e); }
            });
            return Promise.resolve(this);
        };
    };
};
