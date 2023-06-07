<?php exit; //assbbs.com
case 'tiny_save':
$tiny_file=array('user'=>G('uid'),'time'=>sprintf('%.0f',microtime(true)*1000));
if(empty($tiny[G('gid').'_size'])){die('{"warn":"auth"}');}
if(!empty($tiny[G('gid').'_amount'])){
$tiny_file_head=db_sql_find_one('SELECT `time` FROM `'.$db->tablepre.'tiny` WHERE `user`='.$tiny_file['user'].' ORDER BY `time` DESC LIMIT '.($tiny[G('gid').'_amount']-1).',1');
if($tiny_file_head&&(empty($tiny[G('gid').'_interval'])||($tiny_file['time']-$tiny_file_head['time'])<$tiny[G('gid').'_interval']*60000)){die('{"warn":"over"}');}
}
if(empty($_FILES['file'])||!is_uploaded_file($_FILES['file']['tmp_name'])||$_FILES['file']['error']>0||$_FILES['file']['size']<12){die('{"warn":"file"}');}
$tiny_file['size']=$_FILES['file']['size'];
if($tiny_file['size']>$tiny[G('gid').'_size']*1048576){die('{"warn":"size"}');}
$tiny_file['type']=strtolower(substr(strrchr($_FILES['file']['name'],'.'),1));
if(!$tiny_file['type']||!in_array($tiny_file['type'],explode(',',$tiny['filetype']))){die('{"warn":"type"}');}
$tiny_file['date']=date('Ym');
if(db_exec('CREATE TABLE IF NOT EXISTS `'.$db->tablepre.'tiny` ( `user` int(11) unsigned NOT NULL, `time` bigint(13) unsigned NOT NULL, `date` varchar(10) COLLATE utf8_unicode_ci NOT NULL, `type` varchar(10) COLLATE utf8_unicode_ci NOT NULL, `size` bigint(13) unsigned NOT NULL, `used` int(11) unsigned NOT NULL, UNIQUE KEY `user_time` (`user`,`time`), KEY `used_time` (`used`,`time`) ) ENGINE='.$db->rconf['engine'].' DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci; INSERT INTO `'.$db->tablepre.'tiny` SET `user`='.$tiny_file['user'].',`date`="'.$tiny_file['date'].'",`time`='.$tiny_file['time'].',`type`="'.$tiny_file['type'].'",`size`='.$tiny_file['size'].',`used`=0;')===false){die('{"warn":"data"}');}
if(!is_dir('upload/attach/'.$tiny_file['date'])&&!mkdir('upload/attach/'.$tiny_file['date'],0755,true)){die('{"warn":"path"}');}
if(!file_exists($_FILES['file']['tmp_name'])||!move_uploaded_file($_FILES['file']['tmp_name'],'upload/attach/'.$tiny_file['date'].'/'.$tiny_file['user'].'_'.$tiny_file['time'].'.'.$tiny_file['type'])){die('{"warn":"move"}');}
die('{"warn":"done","date":"'.$tiny_file['date'].'","user":"'.$tiny_file['user'].'","time":"'.$tiny_file['time'].'","type":"'.$tiny_file['type'].'"}');
break;
case 'tiny_auth':
$tiny_file=array('user'=>G('uid'),'time'=>sprintf('%.0f',microtime(true)*1000));
if(empty($tiny[G('gid').'_size'])){die('{"warn":"auth"}');}
if(!empty($tiny[G('gid').'_amount'])){
$tiny_file_head=db_sql_find_one('SELECT `time` FROM `'.$db->tablepre.'tiny` WHERE `user`='.$tiny_file['user'].' ORDER BY `time` DESC LIMIT '.($tiny[G('gid').'_amount']-1).',1');
if($tiny_file_head&&(empty($tiny[G('gid').'_interval'])||($tiny_file['time']-$tiny_file_head['time'])<$tiny[G('gid').'_interval']*60000)){die('{"warn":"over"}');}
}
die('{"warn":"done"}');
break;
case 'tiny_jump':
if(empty($_GET['page'])){die;}
$data=thread__read(intval($_GET['page']));if(!$data){die;}
$last=($data['firstpid']<$data['lastpid'])?ceil(($data['posts']+1)/$conf['postlist_pagesize']):1;
if(isset($_GET['goto'])){header('Location:'.url('thread-'.$data['tid'].'-'.$last).'#jump');}
else{echo $last;}
break;
?>