<?php exit; //assbbs.com
$tiny=kv_get('tiny');
function tiny_sync($oldhtml,$newhtml,$pid=0,$tid=0){
global $db,$tiny;
$olditem=$oldhtml?(preg_match_all('/\"upload\/attach\/[\w\/]+\/([\d]+_[\d]{13})\./',$oldhtml,$oldfind)?array_unique($oldfind['1']):array()):array();
$newitem=$newhtml?(preg_match_all('/\"upload\/attach\/[\w\/]+\/([\d]+_[\d]{13})\./',$newhtml,$newfind)?array_unique($newfind['1']):array()):array();
$sql='';
foreach(array_diff($olditem,$newitem) as $row){$spl=explode('_',$row);$sql.='UPDATE `'.$db->tablepre.'tiny` SET `used`=`used`-1 WHERE `user`='.$spl['0'].' AND `time`='.$spl['1'].';';}
foreach(array_diff($newitem,$olditem) as $row){$spl=explode('_',$row);$sql.='UPDATE `'.$db->tablepre.'tiny` SET `used`=`used`+1 WHERE `user`='.$spl['0'].' AND `time`='.$spl['1'].';';}
if($pid){$sql.='UPDATE `'.$db->tablepre.'post` SET `images`='.count($newfind['1']).' WHERE `pid`='.$pid.';';}
if($tid){$sql.='UPDATE `'.$db->tablepre.'thread` SET `images`='.count($newfind['1']).' WHERE `tid`='.$tid.';';}
if(!empty($sql)){db_exec($sql);}
}
function tiny_clean($days){
global $db;
foreach(db_sql_find('SELECT * FROM `'.$db->tablepre.'tiny` WHERE `used`=0 '.(empty($days)?'':'AND `time`<'.(sprintf('%.0f',microtime(true)*1000)-$days*86400000)).' ORDER BY `time` ASC LIMIT 100;') as $row){
$file=APP_PATH.'upload/attach/'.$row['date'].'/'.$row['user'].'_'.$row['time'].'.'.$row['type'];
if(is_file($file)){unlink($file);}
}
db_exec('DELETE FROM `'.$db->tablepre.'tiny` WHERE `used`=0 '.(empty($days)?'':'AND `time`<'.(sprintf('%.0f',microtime(true)*1000)-$days*86400000)).' ORDER BY `time` ASC LIMIT 100;');
}
?>