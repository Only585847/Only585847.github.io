// main
(()=>{
    const _DENSITY=0.5; // 方块密度
    const _LEN=20; // 方块大小
    const ONE_STEP=1; // 一步大小
    const WALL_BUFF=4; // 撞墙距离
    const P_GEN_GHOST=0.05; // 每时刻生成鬼的概率
    const P_SP_GHOST=0.2; // 生成鬼中会穿墙的鬼的概率
    const SUMMON_GHOST_LIMIT=50; // 生成鬼上限
    const MIN_GHOST_SPAWN_DIS=300; // 生成鬼的最近距离
    const MAX_GHOST_SPAWN_DIS=500; // 生成鬼的最远距离
    const KIL_GHOST_DIS=1150; // 保存鬼的最远距离  
    const GHOST_HARM_DIS=10; // 鬼伤害玩家距离

    const canvas=document.getElementById("canvas");
    const ctx=canvas.getContext("2d");

    var _width=1920; // 画布宽度
    var _height=1080; // 画布高度
    var x_scale=_width/canvas.clientWidth; // 缩放至适合屏幕
    var y_scale=_height/canvas.clientHeight; // 缩放至适合屏幕

    var px=0,py=0; // 当前画布偏移
    // 玩家坐标，此时等于 -ShiftX/_LEN
    var shiftBuff=1; // 移动猛烈程度
    var flagUDKey=0,flagLRKey=0; // 按键被按下
    var allowWASD=true;

    var sectors=new Map(); // 加载区块列表
    var sectorVec=new Array(),secCnt=0; // 区块信息
    var HASH_X=10000;

    var explVec=new Array(); // 爆炸
    var ghostVec=new Array(); // 敌对npc

    var health=10; // 生命值
    var heroState=0; // 无敌状态
    var score=0; // 得分
    var gameStop=false; // 游戏暂停

    class Sector{
        /*
            一个区块，坐标编号为 x,y
            大小 480px * 480px
            小方块数量 24*24
            小方块 20px*20px
        */
        constructor(x,y){ // 坐标编号
            this.x=x;
            this.y=y;
            this.blocks=new Array(); // 障碍数组，数组大小24*24
            for(let i=0;i<24;i++){
                let curLine=new Array(); // 当前行
                for(let j=0;j<24;j++)
                    curLine.push(Math.random()<_DENSITY); // 随机放置障碍物
                this.blocks.push(curLine);
            }
        }
        draw(context){
            context.save();

            context.fillStyle="#800"; // 障碍颜色

            context.translate((24*_LEN*this.x)*x_scale,(24*_LEN*this.y)*y_scale); // 移动坐标原点
            for(let i=0;i<24;i++) for(let j=0;j<24;j++){
                if(this.blocks[i][j]){
                    context.fillRect((_LEN*i)*x_scale,(_LEN*j)*y_scale,(_LEN*0.8)*x_scale,(_LEN*0.8)*y_scale); // 绘制方块
                }
            }
            
            context.restore();
        }
    }
    class Expls{
        /*
            产生一次爆炸，半径为radius
        */
        constructor(radius,x,y){
            this.explodeRadius=0;
            this.explodeRadiusMax=radius;
            this.fade=1;
            this.x=x;
            this.y=y;
            this.lastRadius=0;
        }
        draw(context){
            if(this.fade>0){
                context.save();
                context.beginPath();
                context.translate((this.x+_LEN/2)*x_scale,(this.y+_LEN/2)*y_scale);

                // 摧毁障碍
                for(let r=this.lastRadius;r<=this.explodeRadius;r+=_LEN/2){
                    for(let i=0;i<2*Math.PI;i+=1/(2*r/_LEN+5)){
                        destroyBlock(Math.floor((r*Math.cos(i)+this.x+_LEN/2)/_LEN),Math.floor((r*Math.sin(i)+this.y+_LEN/2)/_LEN),1/(this.explodeRadiusMax*this.explodeRadiusMax));
                    }
                }
                // 清除敌对npc
                ghostVec.forEach((ghost)=>{
                    if(getDis(this.x,this.y,ghost.x,ghost.y)<=this.explodeRadius+_LEN*0.45&&ghost.isAlive==true){
                        ghost.isAlive=false;
                    }
                });

                let expGrad=context.createRadialGradient(0,0,0,0,0,Math.max(x_scale,y_scale)*this.explodeRadius); // 渐变效果
                expGrad.addColorStop(0,"#6cf0");
                expGrad.addColorStop(0.6,"#6cf0");
                expGrad.addColorStop(0.99,"#0cfa");
                expGrad.addColorStop(1,"#0cff");
                context.fillStyle=expGrad;
                context.strokeStyle="#0cf8"
                context.globalAlpha=this.fade*0.9; // 透明度（渐淡效果）
                context.beginPath();
                context.ellipse(0,0,this.explodeRadius*x_scale,this.explodeRadius*y_scale,0,0,2*Math.PI); // 冲击波范围
                context.fill();
                context.stroke();

                expGrad=context.createRadialGradient(0,0,0,0,0,Math.min(x_scale,y_scale)*this.explodeRadius); // 渐变效果
                expGrad.addColorStop(0,"#6cf0");
                expGrad.addColorStop(0.6,"#6cf0");
                expGrad.addColorStop(0.99,"#0cfa");
                expGrad.addColorStop(1,"#0cff");
                context.fillStyle=expGrad;
                context.globalAlpha=this.fade*0.1; // 透明度（渐淡效果）
                context.beginPath();
                context.ellipse(0,0,this.explodeRadius*x_scale,this.explodeRadius*y_scale,0,0,2*Math.PI); // 冲击波范围
                context.fill();

                this.lastRadius=this.explodeRadius;
                this.explodeRadius+=(this.explodeRadiusMax-this.explodeRadius)*0.1; // 渐大
                this.fade-=(1-this.fade)*0.8+0.001; // 渐淡

                context.restore();
            }
        }
    }
    class Ghost{
        /*
            敌对npc，会向玩家方向移动。
            部分敌对npc能穿墙。
        */
        constructor(x,y,sp){
            this.x=x; this.y=y; this.sp=sp; this.isAlive=true; this.createCount=0;
        }
        move(){
            let dis=getDis(px,py,this.x,this.y);
            if(!this.sp){ // 无穿墙能力
                let nxtXY=judgeMove(this.x,this.y,ONE_STEP*(px-this.x)/dis,ONE_STEP*(py-this.y)/dis);
                this.x=nxtXY[0]; this.y=nxtXY[1];
            }
            else{ // 有穿墙能力
                this.x+=ONE_STEP*(px-this.x)/dis;
                this.y+=ONE_STEP*(py-this.y)/dis;
            }
        }
        draw(context){
            if(this.isAlive){
                context.save();
                context.beginPath();
                context.translate(this.x*x_scale,this.y*y_scale);
                if(!this.sp) context.fillStyle="#888";
                else context.fillStyle="#bbb";
                context.ellipse(_LEN*0.45*x_scale,_LEN*0.45*y_scale,_LEN*0.45*x_scale,_LEN*0.45*y_scale,0,0,2*Math.PI);
                context.fill();
                context.restore();
            }
        }
    }
    function getDis(x,y,gx,gy){return Math.sqrt((x-gx)*(x-gx)+(y-gy)*(y-gy));}
    function getSection(x,y){
        let id=x*HASH_X+y;
        if(!sectors.has(id)){
            sectorVec.push(new Sector(x,y));
            sectors.set(id,secCnt++);
        }
        return sectorVec[sectors.get(id)];
    }

    function getBlock(x,y){
        let csx=Math.floor(x/24),csy=Math.floor(y/24);
        if(csx!=_lastCsx||csy!=_lastCsy) _CSec=getSection(csx,csy);
        _lastCsx=csx; _lastCsy=csy;
        return _CSec.blocks[x-csx*24][y-csy*24];
    }
    function destroyBlock(x,y,scFact){
        let bsx=Math.floor(x/24),bsy=Math.floor(y/24);
        if(bsx!=_lastBsx||bsy!=_lastBsy) _BSec=getSection(bsx,bsy);
        _lastBsx=bsx; _lastBsy=bsy;
        if(_BSec.blocks[x-bsx*24][y-bsy*24]) score+=250*scFact;
        _BSec.blocks[x-bsx*24][y-bsy*24]=false;
    }
    function judgeMove(x,y,dx,dy){ // 移动判断
        let nx=x+dx,ny=y+dy;
        let ocx=[Math.floor((x+WALL_BUFF)/_LEN),Math.floor((x+_LEN-WALL_BUFF)/_LEN)];
        let ocy=[Math.floor((y+WALL_BUFF)/_LEN),Math.floor((y+_LEN-WALL_BUFF)/_LEN)];
        let nocx=[Math.floor((nx+WALL_BUFF)/_LEN),Math.floor((nx+_LEN-WALL_BUFF)/_LEN)];
        let nocy=[Math.floor((ny+WALL_BUFF)/_LEN),Math.floor((ny+_LEN-WALL_BUFF)/_LEN)];
        if(nocx[0]!=ocx[0]&&nocx[0]!=ocx[1]){
            if(getBlock(nocx[0],ocy[0])||getBlock(nocx[0],ocy[1])) nx=x;
        }else if(nocx[1]!=ocx[0]&&nocx[1]!=ocx[1]){
            if(getBlock(nocx[1],ocy[0])||getBlock(nocx[1],ocy[1])) nx=x;
        }
        if(nocy[0]!=ocy[0]&&nocy[0]!=ocy[1]){
            if(getBlock(ocx[0],nocy[0])||getBlock(ocx[1],nocy[0])) ny=y;
        }else if(nocy[1]!=ocy[0]&&nocy[1]!=ocy[1]){
            if(getBlock(ocx[0],nocy[1])||getBlock(ocx[1],nocy[1])) ny=y;
        }
        return [nx,ny];
    }

    // 游戏主程序



    for(let i=-3;i<=3;i++) for(let j=-3;j<=3;j++){
        sectorVec.push(new Sector(i,j));
        sectors.set(i*HASH_X+j,secCnt++);
    }
    getSection(0,0).blocks[0][0]=false; // 起点无障碍
    // console.log(sectors);

    // 绘制画板
    var _hander; //更新器
    var _lastSx=HASH_X,_lastSy=HASH_X,_lastLst=new Array(); // 渲染优化
    var _lastCsx=HASH_X,_lastCsy=HASH_X,_CSec; // 计算障碍优化
    var _lastBsx=HASH_X,_lastBsy=HASH_X,_BSec; // 计算破坏优化

    // 计算帧数
    var f=0;
    var timeStamp=(new Date()).getTime();
    function fc(){
        var now=(new Date()).getTime();
        if(now-timeStamp<30){ // 限频防卡
            _hander=requestAnimationFrame(fc);
            return false;
        }
        timeStamp=now;
        
        // 清空画布
        ctx.clearRect((-_width*10)*x_scale,(-_height*10)*y_scale,(21*_width)*x_scale,(21*_height)*y_scale);
        ctx.beginPath();

        // 重定向画布中心
        ctx.save();
        ctx.translate(_width/2-_LEN/2,_height/2-_LEN/2); // 原点移到画布中心

        
        // 绘制角色
        if(heroState%10<5)
            ctx.fillStyle="#06c"; // 角色
        else ctx.fillStyle="#06c8";
        if(heroState!=0) heroState--;
        ctx.beginPath();
        ctx.ellipse((_LEN*0.45)*x_scale,_LEN*0.45*y_scale,_LEN*0.45*x_scale,_LEN*0.45*y_scale,0,0,2*Math.PI);
        ctx.fill(); // 绘制角色

        ctx.translate(-px*x_scale,-py*y_scale); // 角色的移动（画面移动）

        // 角色技能（爆炸）
        explVec.forEach((explObj)=>{explObj.draw(ctx);}); // 爆炸效果
        while(explVec.length!=0&&explVec[0].fade<=0) explVec.shift();
        
        // 绘制障碍物
        let sx=Math.floor(px/(24*_LEN)),sy=Math.floor(py/(24*_LEN)); // 玩家所在区块
        if(sx==_lastSx&&sy==_lastSy){
            _lastLst.forEach((sec)=>{sec.draw(ctx);});
        }else{
            _lastSx=sx; _lastSy=sy; _lastLst.length=0;
            for(let i=-3;i<=3;i++){
                for(let j=-3;j<=3;j++){
                    let curSec=getSection(sx+i,sy+j);
                    _lastLst.push(curSec);
                    curSec.draw(ctx);
                }
            }
        }

        ghostVec.forEach((ghost)=>{ghost.draw(ctx);}); // 绘制敌对npc

        // 恢复画布
        ctx.restore();
        
        // 触控基点
        if(touchCurId!=-1){
            ctx.save();
            ctx.fillStyle="#8ac4";
            let cenX=touchStartX*_width/canvas.clientWidth;
            let cenY=touchStartY*_height/canvas.clientHeight;
            ctx.beginPath();
            ctx.ellipse(cenX,cenY,_LEN*x_scale,_LEN*y_scale,0,0,2*Math.PI);
            ctx.fill();
            ctx.strokeStyle="#4568";
            ctx.lineWidth=2;
            ctx.beginPath(); // <
            ctx.moveTo(cenX-_LEN*0.6*x_scale,cenY-_LEN*0.2*y_scale);
            ctx.lineTo(cenX-_LEN*0.8*x_scale,cenY);
            ctx.lineTo(cenX-_LEN*0.6*x_scale,cenY+_LEN*0.2*y_scale);
            ctx.stroke();
            ctx.beginPath(); // ^
            ctx.moveTo(cenX-_LEN*0.2*x_scale,cenY-_LEN*0.6*y_scale);
            ctx.lineTo(cenX,cenY-_LEN*0.8*y_scale);
            ctx.lineTo(cenX+_LEN*0.2*x_scale,cenY-_LEN*0.6*y_scale);
            ctx.stroke();
            ctx.beginPath(); // >
            ctx.moveTo(cenX+_LEN*0.6*x_scale,cenY-_LEN*0.2*y_scale);
            ctx.lineTo(cenX+_LEN*0.8*x_scale,cenY);
            ctx.lineTo(cenX+_LEN*0.6*x_scale,cenY+_LEN*0.2*y_scale);
            ctx.stroke();
            ctx.beginPath(); // \/
            ctx.moveTo(cenX-_LEN*0.2*x_scale,cenY+_LEN*0.6*y_scale);
            ctx.lineTo(cenX,cenY+_LEN*0.8*y_scale);
            ctx.lineTo(cenX+_LEN*0.2*x_scale,cenY+_LEN*0.6*y_scale);
            ctx.stroke();
            ctx.beginPath();
            ctx.fill();
            ctx.restore();
        }
        
        // 游戏暂停图标
        if(gameStop){
            ctx.save();
            ctx.beginPath();
            ctx.translate(_width/2,_height/2); // 原点移到画布中心
            ctx.ellipse(0,0,_LEN*2*x_scale,_LEN*2*y_scale,0,0,2*Math.PI);
            ctx.fillStyle="#888";
            ctx.fill(); // 绘制暂停图标
            ctx.fillStyle="#444";
            ctx.fillRect(-_LEN*x_scale,-_LEN*y_scale,_LEN*0.6*x_scale,_LEN*2*y_scale);
            ctx.fillRect(_LEN*0.4*x_scale,-_LEN*y_scale,_LEN*0.6*x_scale,_LEN*2*y_scale);
            ctx.restore();
        }
        
        // 更新动画
        if(health>0)  _hander=requestAnimationFrame(fc);
        else{
            let u=document.getElementById("info"); if(u) u.remove();
            ctx.save();
            ctx.fillStyle="#c001";
            ctx.globalAlpha=1;
            ctx.fillRect(0,0,_width,_height);
            for(let i=50;i<2000;i+=Math.pow(2500-i,1.5)*0.004)
                setTimeout(()=>{ctx.fillRect(0,0,_width,_height);},i);

            setTimeout(()=>{ctx.restore();_hander=requestAnimationFrame(fail_screen);},2000);
        }
    }
    _hander=requestAnimationFrame(fc);
    function fail_screen(){
        var now=(new Date()).getTime();
        if(now-timeStamp<30){ // 限频防卡
            _hander=requestAnimationFrame(fail_screen);
            return false;
        }
        timeStamp=now;

        // 清空画布
        ctx.clearRect(-_width*10*x_scale,-_height*10*y_scale,21*_width*x_scale,21*_height*y_scale);
        ctx.beginPath();
        ctx.save();
        // ctx.translate(_width/2,_height/2); // 原点移到画布中心
        let gradient=ctx.createLinearGradient(0,0,_width,_height);
        gradient.addColorStop(0,"#06c");
        gradient.addColorStop(1,"#a00");

        ctx.fillStyle=gradient;
        ctx.font="300px SIMHEI";
        ctx.textAlign="center";
        ctx.fillText("游戏结束",(_width/2+Math.random()*10)*1,(_height/2-50+Math.random()*10)*1);
        ctx.font="80px SIMHEI";
        ctx.fillText("你的得分是 "+Math.round(score),(_width/2+Math.random()*5)*1,(_height/2+80+Math.random()*5*1));
        ctx.font="50px SIMHEI";
        ctx.fillText("请刷新页面以重新游玩",(_width/2+Math.random()*20)*1,(_height/2+160)*1);
        _hander=requestAnimationFrame(fail_screen);
    }

    // 键盘操控
    var pressW=false,pressA=false,pressS=false,pressD=false;
    var pressL=false,pressR=false,pressT=false,pressB=false;

    document.addEventListener('keydown',(event)=>{
        const keyName=event.key;
        if(!event.repeat){
            if(keyName=='w') pressW=true;
            else if(keyName=='a') pressA=true;
            else if(keyName=='s') pressS=true;
            else if(keyName=='d') pressD=true;
            else if(keyName=='ArrowUp') pressT=true;
            else if(keyName=='ArrowLeft') pressL=true;
            else if(keyName=='ArrowDown') pressB=true;
            else if(keyName=='ArrowRight') pressR=true;
            else if(keyName==' ') explVec.push(new Expls((shiftBuff+Math.random())*_LEN*1.5,px,py));
            else shiftBuff+=1;
        }
    });
    document.addEventListener('keyup',(event)=>{
        const keyName=event.key;
        if(!event.repeat){
            if(keyName=='w') pressW=false;
            else if(keyName=='a') pressA=false;
            else if(keyName=='s') pressS=false;
            else if(keyName=='d') pressD=false;
            else if(keyName=='ArrowUp') pressT=false;
            else if(keyName=='ArrowLeft') pressL=false;
            else if(keyName=='ArrowDown') pressB=false;
            else if(keyName=='ArrowRight') pressR=false;
            else if(keyName!=' ') shiftBuff-=1;
        }
    });
    // 触控操作
    var touchStartX=-1; // 触摸开始X坐标
    var touchStartY=-1; // 触摸开始Y坐标
    var touchCurId=-1;
    document.addEventListener('touchstart',(event)=>{
        event.preventDefault();
        shiftBuff=Math.min(Math.max(1,event.touches.length),9);
        if(touchCurId==-1){
            let touchs=event.touches[0]; // 取第一次触摸
            touchStartX=touchs.clientX;
            touchStartY=touchs.clientY;
            touchCurId=touchs.identifier;
        }
    },{passive:false});
    document.addEventListener('touchmove',(event)=>{
        event.preventDefault();
        if(touchCurId!=-1){
            let touchs=event.touches[0]; // 取第一次触摸
            let deltaX=touchs.clientX-touchStartX;
            let deltaY=touchs.clientY-touchStartY;
            let deltaDis=getDis(deltaX,deltaY,0,0);
            if(deltaDis!=0){
                flagLRKey=deltaX/deltaDis; // LR方向
                flagUDKey=deltaY/deltaDis; // UD方向
            }
        }
    },{passive:false});
    document.addEventListener('touchend',(event)=>{
        event.preventDefault();
        if(event.changedTouches[0].identifier==touchCurId){
            let touchs=event.changedTouches[0];
            if(touchs.clientX==touchStartX&&touchs.clientY==touchStartY) // 单击而非移动时，也可以炸
                explVec.push(new Expls((shiftBuff+Math.random())*_LEN*1.5,px,py));
            flagLRKey=0; flagUDKey=0;
            touchStartX=-1; touchStartY=-1; touchCurId=-1;
        }else{
            explVec.push(new Expls((shiftBuff+Math.random())*_LEN*1.5,px,py));
        }
        shiftBuff=Math.min(Math.max(1,event.touches.length),9);
    },{passive:false});
    // 清空
    document.addEventListener('focus',()=>{
        gameStop=false;
        flagLRKey=0; flagUDKey=0; shiftBuff=1;
        pressW=false;pressA=false;pressS=false;pressD=false;
        pressL=false;pressR=false;pressT=false;pressB=false;
    });
    document.addEventListener('blur',()=>{
        gameStop=true; shiftBuff=1;
        pressW=false;pressA=false;pressS=false;pressD=false;
        pressL=false;pressR=false;pressT=false;pressB=false;
    });

    // shift操作
    var speedObj=document.getElementById("speed");
    var placeObj=document.getElementById("position");
    var healtObj=document.getElementById("health");
    var scoreObj=document.getElementById("score");
    shiftLoop=()=>{
        if(gameStop){
            setTimeout(shiftLoop,10);
            return false;
        }
        if(shiftBuff<=0) shiftBuff=1;
        if(shiftBuff>=10) shiftBuff=9;
        // 显示速度
        speedObj.innerHTML=shiftBuff;
        // 显示坐标
        placeObj.innerHTML=Math.round(px/_LEN)+','+Math.round(py/_LEN);
        // 显示生命值
        healtObj.innerHTML=health;
        // 显示得分
        scoreObj.innerHTML=Math.round(score);

        if(touchCurId==-1){ // 键盘操作
            flagLRKey=0; flagUDKey=0;
            if(allowWASD&&pressW) flagUDKey-=1;
            if(allowWASD&&pressA) flagLRKey-=1;
            if(allowWASD&&pressS) flagUDKey+=1;
            if(allowWASD&&pressD) flagLRKey+=1;
            if(pressT) flagUDKey-=1;
            if(pressL) flagLRKey-=1;
            if(pressB) flagUDKey+=1;
            if(pressR) flagLRKey+=1;
            if(flagLRKey>1) flagLRKey=1; if(flagLRKey<-1) flagLRKey=-1;
            if(flagUDKey>1) flagUDKey=1; if(flagUDKey<-1) flagUDKey=-1;
        }

        for(let i=0;i<shiftBuff;i++){
            let nxtXY=judgeMove(px,py,flagLRKey*ONE_STEP,flagUDKey*ONE_STEP); // 移动移动
            px=nxtXY[0]; py=nxtXY[1];
        }
        destroyBlock(Math.floor((px+_LEN/2)/_LEN),Math.floor((py+_LEN/2)/_LEN),0); // 有时候角色在爆炸的时候快跑可能会藏到障碍物底下

        // 清除过时npc & npc 造成伤害
        for(let i=0;i<ghostVec.length;i++){
            ghostVec[i].createCount++;
            let dis=getDis(ghostVec[i].x,ghostVec[i].y,px,py);
            if(ghostVec[i].isAlive&&dis<GHOST_HARM_DIS){
                if(heroState==0){
                    health-=1; heroState=70;
                }
                if(health!=0)
                    ghostVec[i].isAlive=false;
            }
            if((ghostVec[i].createCount>100*20)&&Math.random()<P_GEN_GHOST)
                ghostVec[i].isAlive=false;
            if(dis>KIL_GHOST_DIS||ghostVec[i].isAlive==false){
                ghostVec.splice(i,1); i--; continue;
            }
        }

        // 生成敌对npc
        if(ghostVec.length<SUMMON_GHOST_LIMIT&&Math.random()<P_GEN_GHOST){
            let ang=Math.random()*Math.PI*2;
            let dis=Math.random()*(MAX_GHOST_SPAWN_DIS-MIN_GHOST_SPAWN_DIS)+MIN_GHOST_SPAWN_DIS;
            let sx=px+dis*Math.cos(ang), sy=py+dis*Math.sin(ang);
            sx=parseInt(sx/_LEN)*_LEN; sy=parseInt(sy/_LEN)*_LEN;
            if(!getBlock(Math.floor((sx+_LEN/2)/_LEN),Math.floor((sy+_LEN/2)/_LEN)))
                ghostVec.push(new Ghost(sx,sy,Math.random()<P_SP_GHOST));
        }

        // npc移动
        ghostVec.forEach((ghost)=>{ghost.move();});

        if(health>0) setTimeout(shiftLoop,10);
    };
    setTimeout(shiftLoop,10);

    scaleManager=()=>{
        x_scale=_width/canvas.clientWidth; // 缩放至适合屏幕
        y_scale=_height/canvas.clientHeight; // 缩放至适合屏幕
        setTimeout(scaleManager,20);
    }
    setTimeout(scaleManager,20);
})()