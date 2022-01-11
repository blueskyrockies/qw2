function drawChip(ctx,index,xx,yy,c,state,blink) {
    var x=xx+3;
    var y=yy+3;

    var border="black";
    if (state=="inPlay") border=blink;
    if (state=="inHand") border="#114d94";
    ctx.fillStyle=border;
    ctx.fillRect(xx,yy,38,38);    

    if (index==0) strokeStar(ctx,x,y,8,8,2,c);
    if (index==1) strokeStar(ctx,x,y,7,4,3,c);
    if (index==2) drawRect(ctx,x,y,c);
    if (index==3) drawDiamond(ctx,x,y,c);
    if (index==4) drawCircle(ctx,x,y,c);
    if (index==5) drawCross(ctx,x,y,c);
}

function strokeStar(ctx,xx, yy, r, n, inset,c) {
    var x=xx+16;
    var y=yy+16;
    ctx.fillStyle="black";
    ctx.fillRect(x-16,y-16,32,32);

    ctx.save();
    ctx.beginPath();
    ctx.translate(x, y);
    ctx.moveTo(0,0-r);
    for (var i = 0; i < n; i++) {
        ctx.rotate(Math.PI / n);
        ctx.lineTo(0, 0 - (r*inset));
        ctx.rotate(Math.PI / n);
        ctx.lineTo(0, 0 - r);
    }
    ctx.closePath();
    ctx.fillStyle=c;
    ctx.fill();
    ctx.restore();
}

function drawRect(ctx,x,y,c) {
    ctx.fillStyle="black";
    ctx.fillRect(x,y,32,32);
    ctx.fillStyle=c;
    ctx.fillRect(x+5,y+5,22,22);
}

function drawCircle(ctx,x,y,c) {
    ctx.fillStyle="black";
    ctx.fillRect(x,y,32,32);

    ctx.fillStyle=c;
    ctx.strokeStyle=c;
    ctx.beginPath();
    ctx.arc(x+16, y+16, 12, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();   
}

function drawCross(ctx,x,y,c) {
    ctx.fillStyle="black";
    ctx.fillRect(x,y,32,32);

    ctx.fillStyle=c;
    ctx.strokeStyle=c;

    for (i=8;i<=24;i+=8){
        ctx.beginPath();
        ctx.arc(x+i, y+16, 6, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();
    }
    for (i=8;i<=24;i+=8){
        ctx.beginPath();
        ctx.arc(x+16, y+i, 6, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();
    }
    
}

function drawDiamond(ctx,xx,yy,c) {
    ctx.fillStyle="black";
    ctx.fillRect(xx,yy,32,32);

    var x=xx+16;
    var y=yy+3;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);

    var width=26;
    var height=26;
                
    // top left edge
    ctx.lineTo(x - width / 2, y + height / 2);
                
    // bottom left edge
    ctx.lineTo(x, y + height);
                
    // bottom right edge
    ctx.lineTo(x + width / 2, y + height / 2);
                
    // closing the path automatically creates
    // the top right edge
    ctx.closePath();
                
    ctx.fillStyle = c;
    ctx.fill();
    ctx.restore();
}