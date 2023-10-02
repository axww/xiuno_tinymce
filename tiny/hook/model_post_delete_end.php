<?php exit; //assbbs.com
global $tiny;
tiny_sync($post['message'],null);
if(!empty($tiny['cleanday'])){tiny_clean($tiny['cleanday']);}
?>