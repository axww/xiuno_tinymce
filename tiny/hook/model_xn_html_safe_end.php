<?php exit; //assbbs.com
foreach($tiny_media_src as $tiny_src_key=>$tiny_src_row){
$result=str_replace('&tiny_src_'.$tiny_src_key.'="'.$tiny_src_row,'src="'.$tiny_src_row,$result);
}
?>