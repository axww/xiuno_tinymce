<?php exit; //assbbs.com
global $tiny;
tiny_sync($post['message'],$arr['message'],$pid,$isfirst?$tid:0);
if(!empty($tiny['cleanday'])){tiny_clean($tiny['cleanday']);}
?>