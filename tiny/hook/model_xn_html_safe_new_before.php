<?php exit; //assbbs.com
global $tiny;
$tiny_media_src=array(
'https://music.163.com/outchain/player?',
'https://www.ixigua.com/iframe/',
'https://www.douyin.com/light/',
'https://www.acfun.cn/player/',
'https://player.bilibili.com/',
'https://player.youku.com/',
'https://tv.sohu.com/s/',
'https://v.qq.com/txp/',
);
foreach($tiny_media_src as $tiny_src_key=>$tiny_src_row){
$doc=str_replace('src="'.$tiny_src_row,'&tiny_src_'.$tiny_src_key.'="'.$tiny_src_row,$doc);
$white_value['&tiny_src_'.$tiny_src_key]=array('pcre','',array('#^'.$tiny_src_row.'#is'));
}
$white_tag[]='source';
$white_tag[]='video';
$white_tag[]='audio';
$white_value['rel']=array('list','noopener',array('noopener'));
$white_value['allowfullscreen']=array('list','allowfullscreen',array('allowfullscreen'));
$white_value['controls']=array('list','controls',array('controls'));
$white_value['autoplay']=array('list','autoplay',array('autoplay'));
$white_value['preload']=array('list','preload',array('preload'));
$white_value['muted']=array('list','muted',array('muted'));
$white_value['loop']=array('list','loop',array('loop'));
$white_value['poster']=array('pcre','',array($pattern['img_url']));
$white_value['scrolling']=array('list','auto',array('auto','yes','no'));
$white_value['marginwidth']=array('range',0,array(0,10));
$white_value['marginheight']=array('range',0,array(0,10));
$white_value['framespacing']=array('range',0,array(0,10));
$white_css['text-decoration']=array('pcre','none',array($pattern['safe']));
$white_css['border-collapse']=array('pcre','separate',array($pattern['safe']));
$white_css['border-style']=array('pcre','',array($pattern['safe']));
$white_css['border-color']=array('pcre','',array($pattern['css']));
?>