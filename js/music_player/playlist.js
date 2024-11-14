var	playlist = [
{title:"Distortion!!",artist:" ",mp3:"https://zejsz.github.io/blog/songs/Distortion!!.flac",cover:"https://github.com/zejsz/blog-source/blob/master/blog-source/img/3D_Html5_HL/images/10.jpg?raw=true",},
{title:"Blue Spring and Western Sky",artist:" ",mp3:"https://zejsz.github.io/blog/songs/Blue Spring and Western Sky.flac",cover:"https://github.com/zejsz/blog-source/blob/master/blog-source/img/3D_Html5_HL/images/101.jpg?raw=true",},
{title:"Flashbacker",artist:" ",mp3:"https://zejsz.github.io/blog/songs/Flashbacker.flac",cover:"https://github.com/zejsz/blog-source/blob/master/blog-source/img/3D_Html5_HL/images/102.jpg?raw=true",},
{title:"Guitar, Loneliness and Blue Planet",artist:" ",mp3:"https://zejsz.github.io/blog/songs/Guitar, Loneliness and Blue Planet.flac",cover:"https://github.com/zejsz/blog-source/blob/master/blog-source/img/3D_Html5_HL/images/103.jpg?raw=true",},
{title:"Lemon",artist:"米津玄師",mp3:"https://github.com/zejsz/zejsz.github.io/raw/refs/heads/master/blog/songs/Lemon-%E7%B1%B3%E6%B4%A5%E7%8E%84%E5%B8%AB%23ghxLh.mp3",cover:"https://github.com/zejsz/blog-source/blob/master/blog-source/img/3D_Html5_HL/images/109.jpg?raw=true",},
{title:"be with you",artist:"Tiara",mp3:"https://github.com/zejsz/zejsz.github.io/raw/refs/heads/master/blog/songs/be%20with%20you-Tiara%231qh4C.mp3",cover:"https://github.com/zejsz/blog-source/blob/master/blog-source/img/3D_Html5_HL/images/118.jpg?raw=true",},
{title:"ecret base .君がくれたもの",artist:"小缘",mp3:"https://github.com/zejsz/zejsz.github.io/raw/refs/heads/master/blog/songs/secret%20base%20.%E5%90%9B%E3%81%8C%E3%81%8F%E3%82%8C%E3%81%9F%E3%82%82%E3%81%AE.-%E5%B0%8F%E7%BC%98%23iRkt8.mp3",cover:"https://github.com/zejsz/blog-source/blob/master/blog-source/img/3D_Html5_HL/images/113.jpg?raw=true",},
{title:"インタビュア",artist:"H.G",mp3:"https://github.com/zejsz/zejsz.github.io/raw/refs/heads/master/blog/songs/%E3%82%A4%E3%83%B3%E3%82%BF%E3%83%93%E3%83%A5%E3%82%A2-H.G%23fcgfz.mp3",cover:"https://github.com/zejsz/blog-source/blob/master/blog-source/img/3D_Html5_HL/images/112.jpg?raw=true",},
{title:"ブルーバード",artist:"いきものがかり",mp3:"https://github.com/zejsz/zejsz.github.io/raw/refs/heads/master/blog/songs/%E3%83%96%E3%83%AB%E3%83%BC%E3%83%90%E3%83%BC%E3%83%89-%E3%81%84%E3%81%8D%E3%82%82%E3%81%AE%E3%81%8C%E3%81%8B%E3%82%8A%23hy28B.mp3",cover:"https://github.com/zejsz/blog-source/blob/master/blog-source/img/3D_Html5_HL/images/114.jpg?raw=true",},
{title:"我的歌声里",artist:"曲婉婷",mp3:"https://github.com/zejsz/zejsz.github.io/raw/refs/heads/master/blog/songs/%E6%88%91%E7%9A%84%E6%AD%8C%E5%A3%B0%E9%87%8C-%E6%9B%B2%E5%A9%89%E5%A9%B7%231zl1C.mp3",cover:"https://github.com/zejsz/blog-source/blob/master/blog-source/img/3D_Html5_HL/images/111.jpg?raw=true",},
{title:"月光",artist:"胡彦斌",mp3:"https://github.com/zejsz/zejsz.github.io/raw/refs/heads/master/blog/songs/%E6%9C%88%E5%85%89-%E8%83%A1%E5%BD%A6%E6%96%8C%231KVJC.mp3",cover:"https://github.com/zejsz/blog-source/blob/master/blog-source/img/3D_Html5_HL/images/12.jpg?raw=true",},
];
  var isRotate = true;
  var autoplay = true;

function bgChange(){
	var lis= $('.lib');
	for(var i=0; i<lis.length; i+=2)
	lis[i].style.background = 'rgba(246, 246, 246, 0.7)';
}
window.onload = bgChange;