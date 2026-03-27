const boardElement = document.getElementById("board");
const statusText = document.getElementById("status");
const overlay = document.getElementById("overlay");
const resultText = document.getElementById("resultText");

let board, currentPlayer, selected, possibleMoves, gameOver;

const pieces = {
  "P":"♙","R":"♖","N":"♘","B":"♗","Q":"♕","K":"♔",
  "p":"♟","r":"♜","n":"♞","b":"♝","q":"♛","k":"♚"
};

// RESET
function resetGame(){
  board = [
    ["r","n","b","q","k","b","n","r"],
    ["p","p","p","p","p","p","p","p"],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["P","P","P","P","P","P","P","P"],
    ["R","N","B","Q","K","B","N","R"]
  ];

  currentPlayer = "white";
  selected = null;
  possibleMoves = [];
  gameOver = false;

  overlay.classList.add("hidden");

  updateStatus();
  drawBoard();
}

resetGame();

// DRAW
function drawBoard(){
  boardElement.innerHTML = "";

  for(let i=0;i<8;i++){
    for(let j=0;j<8;j++){
      let cell = document.createElement("div");
      cell.className = "cell " + ((i+j)%2==0?"white":"black");

      let piece = board[i][j];
      if(piece) cell.textContent = pieces[piece];

      if(selected && selected.r===i && selected.c===j){
        cell.classList.add("selected");
      }

      if(possibleMoves.some(m => m.r===i && m.c===j)){
        if(piece) cell.classList.add("capture");
        else cell.classList.add("move");
      }

      cell.onclick = () => handleClick(i,j);
      boardElement.appendChild(cell);
    }
  }
}

// CLICK
function handleClick(r,c){
  if(gameOver) return;

  let piece = board[r][c];

  if(selected){
    if(possibleMoves.some(m => m.r===r && m.c===c)){
      movePiece(selected.r, selected.c, r, c);
      selected = null;
      possibleMoves = [];
      drawBoard();

      if(currentPlayer==="black" && !gameOver){
        setTimeout(aiMove, 300);
      }
      return;
    }
  }

  if(piece && isWhite(piece)===(currentPlayer==="white")){
    selected = {r,c};
    possibleMoves = getAllMoves(r,c);
  } else {
    selected = null;
    possibleMoves = [];
  }

  drawBoard();
}

// MOVE
function movePiece(sr,sc,dr,dc){
  let piece = board[sr][sc];
  let target = board[dr][dc];

  // KING CAPTURE → GAME OVER
  if(target === "K" || target === "k"){
    gameOver = true;

    let winner = isWhite(piece) ? "White" : "Black";

    statusText.textContent = `🏆 ${winner} Wins (King Captured!)`;

    resultText.textContent = `♛ GAME OVER ♛\n${winner} Wins!`;
    overlay.classList.remove("hidden");

    return;
  }

  // Promotion
  if(piece==="P" && dr===0) piece="Q";
  if(piece==="p" && dr===7) piece="q";

  board[dr][dc] = piece;
  board[sr][sc] = "";

  currentPlayer = currentPlayer==="white"?"black":"white";

  // CHECK
  if(isCheck(currentPlayer)){
    statusText.textContent =
      currentPlayer==="white"
        ? "⚠️ White is in CHECK!"
        : "⚠️ Black (AI) is in CHECK!";
  } else {
    updateStatus();
  }

  // CHECKMATE
  if(isCheckmate(currentPlayer)){
    gameOver = true;

    let winner = currentPlayer==="white"?"Black":"White";

    statusText.textContent = `🏆 ${winner} Wins by Checkmate!`;

    resultText.textContent = `♛ CHECKMATE ♛\n${winner} Wins!`;
    overlay.classList.remove("hidden");

    return;
  }
}

// STATUS
function updateStatus(){
  if(gameOver) return;

  statusText.textContent =
    currentPlayer==="white"
      ? "♟️ White to move"
      : "♟️ Black (AI) to move";
}

// MOVES
function getAllMoves(r,c){
  let moves = [];
  for(let i=0;i<8;i++){
    for(let j=0;j<8;j++){
      if(validMove(r,c,i,j)){
        moves.push({r:i,c:j});
      }
    }
  }
  return moves;
}

function validMove(sr,sc,dr,dc){
  let piece = board[sr][sc];
  let target = board[dr][dc];
  if(!piece) return false;

  if(target && isWhite(piece)===isWhite(target)) return false;

  let dx = dr - sr;
  let dy = dc - sc;

  switch(piece.toLowerCase()){
    case "p":
      let dir = isWhite(piece)?-1:1;
      if(dy===0 && !target && dx===dir) return true;
      if(dy===0 && !target && dx===2*dir && (sr===6||sr===1)) return true;
      if(Math.abs(dy)===1 && dx===dir && target) return true;
      break;

    case "r":
      if(dx===0 || dy===0) return clearPath(sr,sc,dr,dc);
      break;

    case "n":
      if((Math.abs(dx)===2 && Math.abs(dy)===1) ||
         (Math.abs(dx)===1 && Math.abs(dy)===2)) return true;
      break;

    case "b":
      if(Math.abs(dx)===Math.abs(dy)) return clearPath(sr,sc,dr,dc);
      break;

    case "q":
      if(dx===0 || dy===0 || Math.abs(dx)===Math.abs(dy))
        return clearPath(sr,sc,dr,dc);
      break;

    case "k":
      if(Math.abs(dx)<=1 && Math.abs(dy)<=1) return true;
      break;
  }
  return false;
}

function clearPath(sr,sc,dr,dc){
  let dx = Math.sign(dr-sr);
  let dy = Math.sign(dc-sc);

  let r = sr + dx;
  let c = sc + dy;

  while(r!==dr || c!==dc){
    if(board[r][c] !== "") return false;
    r+=dx; c+=dy;
  }
  return true;
}

// CHECK
function isCheck(player){
  let king;

  for(let i=0;i<8;i++){
    for(let j=0;j<8;j++){
      if(board[i][j] === (player==="white"?"K":"k")){
        king = {i,j};
      }
    }
  }

  for(let i=0;i<8;i++){
    for(let j=0;j<8;j++){
      let p = board[i][j];
      if(p && isWhite(p)!==(player==="white")){
        if(validMove(i,j,king.i,king.j)) return true;
      }
    }
  }
  return false;
}

// CHECKMATE
function isCheckmate(player){
  if(!isCheck(player)) return false;

  for(let i=0;i<8;i++){
    for(let j=0;j<8;j++){
      let p = board[i][j];

      if(p && isWhite(p)===(player==="white")){
        for(let x=0;x<8;x++){
          for(let y=0;y<8;y++){
            if(validMove(i,j,x,y)){

              let temp = board[x][y];
              board[x][y] = p;
              board[i][j] = "";

              let stillCheck = isCheck(player);

              board[i][j] = p;
              board[x][y] = temp;

              if(!stillCheck) return false;
            }
          }
        }
      }
    }
  }
  return true;
}

// MINIMAX
function evaluateBoard(){
  let score = 0;
  const val = {p:10,n:30,b:30,r:50,q:90,k:900};

  for(let i=0;i<8;i++){
    for(let j=0;j<8;j++){
      let p = board[i][j];
      if(p){
        score += isWhite(p) ? -val[p.toLowerCase()] : val[p.toLowerCase()];
      }
    }
  }
  return score;
}

function minimax(depth, isMax){
  if(depth===0) return evaluateBoard();

  let best = isMax ? -Infinity : Infinity;

  for(let i=0;i<8;i++){
    for(let j=0;j<8;j++){
      let p = board[i][j];

      if(p && (isMax ? !isWhite(p) : isWhite(p))){
        let moves = getAllMoves(i,j);

        for(let m of moves){
          let temp = board[m.r][m.c];
          board[m.r][m.c] = p;
          board[i][j] = "";

          let score = minimax(depth-1, !isMax);

          board[i][j] = p;
          board[m.r][m.c] = temp;

          best = isMax ? Math.max(best, score) : Math.min(best, score);
        }
      }
    }
  }
  return best;
}

function getBestMove(){
  let bestScore = -Infinity;
  let bestMove = null;

  for(let i=0;i<8;i++){
    for(let j=0;j<8;j++){
      let p = board[i][j];

      if(p && !isWhite(p)){
        let moves = getAllMoves(i,j);

        for(let m of moves){
          let temp = board[m.r][m.c];
          board[m.r][m.c] = p;
          board[i][j] = "";

          let score = minimax(2, false);

          board[i][j] = p;
          board[m.r][m.c] = temp;

          if(score > bestScore){
            bestScore = score;
            bestMove = {sr:i, sc:j, dr:m.r, dc:m.c};
          }
        }
      }
    }
  }
  return bestMove;
}

function aiMove(){
  if(gameOver) return;

  let move = getBestMove();
  if(move){
    movePiece(move.sr, move.sc, move.dr, move.dc);
    drawBoard();
  }
}

function isWhite(p){
  return p === p.toUpperCase();
}
