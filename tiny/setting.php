<?php !defined('DEBUG') AND exit('Access Denied.'); //assbbs.com
if($method=='POST'){
if(param('csrf')!=session_id()){message(0,'<a href="'.http_referer().'">滚你妈的</a>');}
$post=array();
$post['cleanday']=intval(param('cleanday',0));
foreach($grouplist as $row){
$post[$row['gid'].'_interval']=intval(param($row['gid'].'_interval',0));
$post[$row['gid'].'_amount']=intval(param($row['gid'].'_amount',0));
$post[$row['gid'].'_size']=intval(param($row['gid'].'_size',0));
}
$post['filetype']=strtolower(trim(param('filetype')));
$post['noattach']=param('noattach',0);
$post['jimg']=trim(preg_replace('/\s(?=\s)/','\\1',param('jimg','',false)));
$post['outstyle']=trim(preg_replace('/\s(?=\s)/','\\1',param('outstyle','',false)));
$post['myconfig']=trim(preg_replace('/\s(?=\s)/','\\1',param('myconfig','',false)));
kv_set('tiny',$post);
message(0,'<a href="'.http_referer().'">修改成功</a>');
}
elseif(isset($_GET['trash'])){
error_reporting(0);
echo json_encode(db_sql_find('SELECT * FROM `'.$db->tablepre.'tiny` WHERE `used`=0 ORDER BY `time` ASC LIMIT 100;'));
}
elseif(isset($_GET['clean']) && $_GET['csrf']==session_id()){
tiny_clean(0);
}
else{
$json=json_decode(file_get_contents(APP_PATH.'plugin/tiny/conf.json'),true);
include _include(ADMIN_PATH.'view/htm/header.inc.htm');
echo '
<form action="" method="post" id="form">
<div><b>当前版本</b>：'.$json['version'].'</div>
<div><b>屌丝论坛</b>：<a href="https://assbbs.com" target="_blank">https://assbbs.com</a></div>
<div><b>云库论坛</b>：<a href="https://cloudatabases.com" target="_blank">https://cloudatabases.com</a></div>
<hr />
<div><b>文件清理</b>（上传*天后未使用则删除，填写“0”不启用）</div>
<div>'.form_text('cleanday',empty($tiny['cleanday'])?0:$tiny['cleanday']).'</div>
<div><a href="javascript:;" onclick="tiny_clean();">手动删除</a>（100条未使用文件，不要误删编辑中内容）</div>
<span id="tiny_trash"></span>
<hr />
<table>
<tbody>
<tr>
<th><b>上传权限</b></th>
<th><a href="javascript:;" onclick="alert(\'填写“0”为永久\r\n强烈不建议设置为永久\r\n推荐值：1440\');">配额周期（分）</a></th>
<th><a href="javascript:;" onclick="alert(\'填写“0”不限制\r\n数值越大主机压力越大\r\n推荐值：100\');">最多上传（个）</a></th>
<th><a href="javascript:;" onclick="alert(\'填写“0”关闭该组上传\r\n建议不要太大以免中断\r\n推荐值：5\');">最大尺寸（MB）</a></th>
</tr>
';
foreach($grouplist as $row){
echo '
<tr>
<td>'.$row['gid'].':'.$row['name'].'</td>
<td>'.form_text($row['gid'].'_interval',empty($tiny[$row['gid'].'_interval'])?0:$tiny[$row['gid'].'_interval']).'</td>
<td>'.form_text($row['gid'].'_amount',empty($tiny[$row['gid'].'_amount'])?0:$tiny[$row['gid'].'_amount']).'</td>
<td>'.form_text($row['gid'].'_size',empty($tiny[$row['gid'].'_size'])?0:$tiny[$row['gid'].'_size']).'</td>
</tr>
';
}
echo '
</tbody>
</table>
<div>文件类型（gif,jpg,jpeg,png,bmp,ico,webp,mp4,m4v,mov,webm,m4a,wav,mp3,flac,weba,txt,pdf,zip）</div>
<div>'.form_text('filetype',empty($tiny['filetype'])?'':$tiny['filetype']).'</div>
<div>关闭附件&nbsp;&nbsp;'.form_radio_yes_no('noattach',empty($tiny['noattach'])?0:1).'</div>
<div>服务器端（以下设置必须高于最大尺寸）</div>
<div>[php.ini] post_max_size (当前:'.ini_get('post_max_size').')</div>
<div>[php.ini] upload_max_filesize (当前:'.ini_get('upload_max_filesize').')</div>
<div>[nginx.conf] client_max_body_size (<a href="https://www.cnblogs.com/zhwl/archive/2012/09/18/2690714.html" target="_blank">了解详情</a>)</div>
<hr />
<div><b>图片处理</b>（前端压缩，方向矫正，添加水印）</div>
<div>'.form_textarea('jimg',empty($tiny['jimg'])?'':$tiny['jimg']).'</div>
<div>// 【压缩】</div>
<div>// _png|_jpg|_webp: 压缩模板命名</div>
<div>// width: 转换后最大宽度</div>
<div>// width: (undefined)||null||false 不限制</div>
<div>// height: 转换后最大高度</div>
<div>// height: (undefined)||null||false 不限制</div>
<div>// fill: 背景填充色</div>
<div>// fill: (undefined)||null||false 透明</div>
<div>// format: image/png||image/jpeg||image/webp 输出格式选项</div>
<div>// format: (undefined)||null||false image/png</div>
<div>// quality: <0.01-1> 压缩比例 输出格式image/png无视该项</div>
<div>// quality: (undefined)||null||false 0.9</div>
<div>// render: {} CanvasRenderingContext2D 渲染属性</div>
<div>// render: (undefined)||null||false 使用浏览器默认</div>
<div>_png: {width:4096,height:4096,fill:null,format:"image/png",quality:0.9},</div>
<div>_jpg: {width:4096,height:4096,fill:"#FFF",format:"image/jpeg",quality:0.9},</div>
<div>_webp: {width:4096,height:4096,fill:null,format:"image/webp",quality:0.9},</div>
<div>// 【上传】</div>
<div>// png|jpg|bmp|ico|gif|webp: 指定格式设置</div>
<div>// normal: 常规输出使用哪个模板</div>
<div>// normal: (undefined)||null||false 使用脚本默认</div>
<div>// nowebp: 浏览器不支持webp输出时使用哪个模板</div>
<div>// nowebp: (undefined) 继承normal模板</div>
<div>// nowebp: null||false 不压缩直接输出</div>
<div>// animate: 图片检测到动画时使用哪个模板</div>
<div>// animate: (undefined) 继承normal模板</div>
<div>// animate: null||false 不压缩直接输出</div>
<div>png: {normal:"_webp",nowebp:"_png",animate:false},</div>
<div>jpg: {normal:"_webp",nowebp:"_jpg"},</div>
<div>bmp: {normal:"_webp",nowebp:"_jpg"},</div>
<div>ico: null,</div>
<div>gif: {normal:"_webp",nowebp:"_jpg",animate:false},</div>
<div>webp: {normal:"_webp",nowebp:"_png",animate:false},</div>
<div>// 【水印】</div>
<div>// _chop: (undefined)||null||false 不添加水印</div>
<div>// url: 水印图片 同域名URL或Base64编码的DataURL</div>
<div>// url: (undefined)||null||false 不添加水印</div>
<div>// width: 原图达到此宽度才添加水印</div>
<div>// width: (undefined)||null||false 0</div>
<div>// height: 原图达到此高度才添加水印</div>
<div>// height: (undefined)||null||false 0</div>
<div>// x: 顶点横坐标 负数为从右到左 0-1小数为中轴百分比</div>
<div>// x: (undefined)||null||false 0</div>
<div>// y: 顶点纵坐标 负数为从下到上 0-1小数为中轴百分比</div>
<div>// y: (undefined)||null||false 0</div>
<div>_chop: {url:"view/img/logo.png",width:400,height:200,x:0.5,y:-80},</div>
</span>
<hr />
<div><b>全局样式</b></div>
<div>'.form_textarea('outstyle',empty($tiny['outstyle'])?'':$tiny['outstyle']).'</div>
<div>.message a{text-decoration:underline !important;}/*链接加下划线*/</div>
<div>.message img,.message audio,.message video{margin-top:8px !important;}/*媒体比例优化*/</div>
<div>.message table,.message th,.message td{border:1px solid #999 !important;}/*表格简易样式*/</div>
<div>.message img,.message audio,.message video,.message iframe,.message table{max-width:100% !important;}/*元素最大宽度*/</div>
<div>@media(min-width:1000px){.message img,.message audio,.message video{max-width:720px !important;}}/*限制大屏宽度*/</div>
<hr />
<div><b>插件配置</b></div>
<div>'.form_textarea('myconfig',empty($tiny['myconfig'])?'':$tiny['myconfig']).'</div>
<div>每行一个JSON对象键值</div>
<div>结尾必须加分隔符,</div>
<hr />
<input name="csrf" value="'.session_id().'" style="display:none;" />
<div><input type="submit" id="submit" value="'.lang('confirm').'" /></div>
</form>
<script>
function tiny_trash(){
document.querySelector(\'#tiny_trash\').innerHTML=\'\';
var xhr=new XMLHttpRequest;
xhr.open(\'GET\',\''.url('plugin-setting-tiny').'?&trash\');
xhr.onreadystatechange=function(){
if(this.readyState===4 && this.status===200){
var json=JSON.parse(this.responseText);
for(var i=0;i<json.length;i++){
var tobj=new Date(parseInt(json[i].time));
document.querySelector(\'#tiny_trash\').innerHTML+=\'<div><a href="../?user-\'+json[i].user+\'.htm" target="_blank">[\'+tobj.getFullYear()+\'-\'+(tobj.getMonth()+1)+\'-\'+tobj.getDate()+\']</a> <a href="../upload/attach/\'+json[i].date+\'/\'+json[i].user+\'_\'+json[i].time+\'.\'+json[i].type+\'" target="_blank">\'+(json[i].size/1048576).toFixed(2)+\' MB (\'+json[i].type+\')</a></div>\';
};
};
};
xhr.send(null);
};
function tiny_clean(){
if(!confirm(\'确认清理？\')){return;};
var xhr=new XMLHttpRequest;
xhr.open(\'GET\',\''.url('plugin-setting-tiny').'?&clean&csrf=\'+document.querySelector(\'input[name="csrf"]\').value);
xhr.onreadystatechange=function(){
if(this.readyState===4 && this.status===200){
tiny_trash();
};
};
xhr.send(null);
};
tiny_trash();
</script>
';
include _include(ADMIN_PATH.'view/htm/footer.inc.htm');
}
?>