<?php exit; //assbbs.com
global $tiny;
// 统一文本换行为P
if($arr['doctype']==1){$arr['message_fmt']='<p>'.str_replace(array('<br>','<p></p>'),array('</p><p>','<p>&nbsp;</p>'),$arr['message_fmt']).'</p>';}
?>