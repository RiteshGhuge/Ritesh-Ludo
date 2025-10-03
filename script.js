document.addEventListener('DOMContentLoaded', () => {
    // --- Game State Variables ---
    const players = ['red', 'green', 'yellow', 'blue'];
    let currentPlayerIndex = 0;
    let diceValue = 0;
    let diceRolled = false;

    // --- DOM Elements ---
    const board = document.getElementById('board');
    const dice = document.getElementById('dice');
    const rollBtn = document.getElementById('roll-dice-btn');
    const turnIndicator = document.getElementById('turn-indicator');
    const gameMessage = document.getElementById('game-message');
    const pawns = document.querySelectorAll('.pawn');

    // --- Game Board Configuration ---
    // Path coordinates [row, col] for each step
    const mainPath = [
        // Red Path Start to Green Base
        [7, 2], [7, 3], [7, 4], [7, 5], [7, 6],
        [6, 7], [5, 7], [4, 7], [3, 7], [2, 7], [1, 7],
        [1, 8], [1, 9],
        // Green Path Start to Yellow Base
        [2, 9], [3, 9], [4, 9], [5, 9], [6, 9],
        [7, 10], [7, 11], [7, 12], [7, 13], [7, 14], [7, 15],
        [8, 15], [9, 15],
        // Yellow Path Start to Blue Base
        [9, 14], [9, 13], [9, 12], [9, 11], [9, 10],
        [10, 9], [11, 9], [12, 9], [13, 9], [14, 9], [15, 9],
        [15, 8], [15, 7],
        // Blue Path Start to Red Base
        [14, 7], [13, 7], [12, 7], [11, 7], [10, 7],
        [9, 6], [9, 5], [9, 4], [9, 3], [9, 2], [9, 1],
        [8, 1], [7, 1]
    ];

    const homePaths = {
        red: [[8, 2], [8, 3], [8, 4], [8, 5], [8, 6], [8, 7]],
        green: [[2, 8], [3, 8], [4, 8], [5, 8], [6, 8], [7, 8]],
        yellow: [[8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9]],
        blue: [[14, 8], [13, 8], [12, 8], [11, 8], [10, 8], [9, 8]]
    };

    const startPositions = {
        red: 0,
        green: 13,
        yellow: 26,
        blue: 39
    };
    
    const safeSpots = [0, 8, 13, 21, 26, 34, 39, 47];

    // --- Pawn State ---
    let pawnStates = {};

    function initializeGame() {
        // Create Path Cells on the board
        mainPath.forEach((pos, index) => {
            const cell = document.createElement('div');
            cell.classList.add('path-cell');
            cell.style.gridRowStart = pos[0];
            cell.style.gridColumnStart = pos[1];
            // Color starting cells
            if (index === startPositions.red) cell.style.backgroundColor = '#ffcccc';
            if (index === startPositions.green) cell.style.backgroundColor = '#ccffcc';
            if (index === startPositions.yellow) cell.style.backgroundColor = '#ffffcc';
            if (index === startPositions.blue) cell.style.backgroundColor = '#ccccff';
            if(safeSpots.includes(index)) cell.classList.add('safe-spot');
            board.appendChild(cell);
        });

        Object.values(homePaths).flat().forEach((pos, index) => {
             const cell = document.createElement('div');
            cell.classList.add('path-cell');
            cell.style.gridRowStart = pos[0];
            cell.style.gridColumnStart = pos[1];
            if(index < 6) cell.style.backgroundColor = '#ffcccc';
            else if (index < 12) cell.style.backgroundColor = '#ccffcc';
            else if (index < 18) cell.style.backgroundColor = '#ffffcc';
            else cell.style.backgroundColor = '#ccccff';
            board.appendChild(cell);
        });

        // Initialize Pawn States
        players.forEach(color => {
            pawnStates[color] = [];
            for (let i = 1; i <= 4; i++) {
                pawnStates[color].push({ id: `${color}-pawn-${i}`, position: -1, state: 'home' }); // -1 means in home base
            }
        });
        resetPawnPositions();
        updateTurnIndicator();
    }

    function resetPawnPositions() {
        Object.keys(pawnStates).forEach(color => {
            const homeBase = document.getElementById(`${color}-base`).querySelector('.home');
            const homePawns = homeBase.querySelectorAll('.pawn');
            pawnStates[color].forEach((pawn, index) => {
                const pawnElement = document.getElementById(pawn.id);
                // Move pawn element back to its home container
                homePawns[index].appendChild(pawnElement);
                pawnElement.style.position = 'static'; // reset positioning
            });
        });
    }
    
    function updatePawnPosition(pawnId, newPosIndex, state) {
        const [color] = pawnId.split('-');
        const pawnState = pawnStates[color].find(p => p.id === pawnId);
        if (!pawnState) return;
        
        pawnState.position = newPosIndex;
        pawnState.state = state;

        const pawnElement = document.getElementById(pawnId);
        board.appendChild(pawnElement); // Move pawn to be a direct child of the board
        pawnElement.style.position = 'absolute';

        let targetCoords;
        if (state === 'active') {
             targetCoords = mainPath[newPosIndex];
        } else if (state === 'homing') {
            targetCoords = homePaths[color][newPosIndex];
        } else if (state === 'finished') {
            const center = document.querySelector('.center-home');
            pawnElement.style.left = center.offsetLeft + 'px';
            pawnElement.style.top = center.offsetTop + 'px';
            return; // Finished, no need for grid positioning
        }

        pawnElement.style.top = `${(targetCoords[0] - 1) * 40}px`;
        pawnElement.style.left = `${(targetCoords[1] - 1) * 40}px`;
    }

    function rollDice() {
        if (diceRolled) {
            gameMessage.textContent = "You've already rolled. Move a pawn.";
            return;
        }
        diceValue = Math.floor(Math.random() * 6) + 1;
        dice.textContent = diceValue;
        diceRolled = true;
        gameMessage.textContent = '';

        const currentPlayer = players[currentPlayerIndex];
        const movablePawns = getMovablePawns(currentPlayer, diceValue);

        if (movablePawns.length === 0) {
            gameMessage.textContent = "No valid moves. Switching turn.";
            setTimeout(switchTurn, 1000);
        } else {
            // Highlight movable pawns
            movablePawns.forEach(pawn => {
                document.getElementById(pawn.id).classList.add('movable');
            });
        }
    }

    function getMovablePawns(playerColor, roll) {
        const playerPawns = pawnStates[playerColor];
        const movable = [];
        
        playerPawns.forEach(pawn => {
            if(pawn.state === 'finished') return;

            if (pawn.state === 'home' && roll === 6) {
                movable.push(pawn);
            } else if (pawn.state === 'active') {
                const entryPoint = (startPositions[playerColor] + 51) % 52;
                const currentPos = pawn.position;
                let stepsToHome = 0;
                if(currentPos >= startPositions[playerColor]) {
                    stepsToHome = entryPoint - currentPos + 1;
                } else {
                    stepsToHome = (52 - startPositions[playerColor]) + entryPoint +1;
                }
                
                if((stepsToHome+6) >= roll){
                    movable.push(pawn);
                }

            } else if (pawn.state === 'homing') {
                 if (pawn.position + roll < 6) { // can move within home path
                    movable.push(pawn);
                 }
            }
        });
        return movable;
    }

    function movePawn(e) {
        const pawnElement = e.target;
        if (!pawnElement.classList.contains('pawn')) return;

        const pawnId = pawnElement.id;
        const [color] = pawnId.split('-');
        
        if (color !== players[currentPlayerIndex] || !diceRolled || !pawnElement.classList.contains('movable')) {
            return; // Not this player's turn, or dice not rolled, or pawn not movable
        }

        const pawnState = pawnStates[color].find(p => p.id === pawnId);
        
        // --- Move Logic ---
        if (pawnState.state === 'home' && diceValue === 6) {
            updatePawnPosition(pawnId, startPositions[color], 'active');
        } else if (pawnState.state === 'active') {
            const entryPoint = (startPositions[color] + 51) % 52;
            const currentPos = pawnState.position;
            
            let newPos = currentPos;
            for(let i = 0; i < diceValue; i++) {
                newPos = (newPos + 1) % 52;
                if(newPos === entryPoint) {
                    const remainingSteps = diceValue - (i + 1);
                    if (remainingSteps < 6) {
                        updatePawnPosition(pawnId, remainingSteps, 'homing');
                    }
                    if(remainingSteps === 5) {
                         updatePawnPosition(pawnId, 5, 'finished');
                         checkWinCondition(color);
                    }
                    postMove();
                    return;
                }
            }
            updatePawnPosition(pawnId, newPos, 'active');
            handleCapture(newPos, color);

        } else if(pawnState.state === 'homing'){
            const newHomePos = pawnState.position + diceValue;
            if(newHomePos === 5) { // Reached the center
                updatePawnPosition(pawnId, newHomePos, 'finished');
                checkWinCondition(color);
            } else {
                 updatePawnPosition(pawnId, newHomePos, 'homing');
            }
        }
        
        postMove();
    }
    
    function handleCapture(position, attackerColor) {
        if(safeSpots.includes(position)) return;

        Object.keys(pawnStates).forEach(color => {
            if (color === attackerColor) return;
            pawnStates[color].forEach(pawn => {
                if (pawn.state === 'active' && pawn.position === position) {
                    // Send opponent pawn home
                    pawn.position = -1;
                    pawn.state = 'home';
                    const pawnElement = document.getElementById(pawn.id);
                    const homeBase = document.getElementById(`${color}-base`).querySelector('.home');
                    // Find an empty spot in the home visually
                    const homeSpots = homeBase.children;
                    for (let spot of homeSpots) {
                        if (spot.childElementCount === 0) {
                            spot.appendChild(pawnElement);
                            pawnElement.style.position = 'static';
                            break;
                        }
                    }
                    gameMessage.textContent = `${attackerColor.toUpperCase()} captured ${color.toUpperCase()}'s pawn!`;
                }
            });
        });
    }

    function postMove() {
        // Clear highlights
        document.querySelectorAll('.movable').forEach(p => p.classList.remove('movable'));
        
        if (diceValue === 6) {
            // Extra turn for rolling a 6 or capturing
            diceRolled = false;
            gameMessage.textContent = `${players[currentPlayerIndex].toUpperCase()} gets another turn!`;
        } else {
            switchTurn();
        }
    }
    
    function switchTurn() {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        diceRolled = false;
        dice.textContent = '?';
        updateTurnIndicator();
        gameMessage.textContent = '';
         document.querySelectorAll('.movable').forEach(p => p.classList.remove('movable'));
    }

    function updateTurnIndicator() {
        const currentPlayer = players[currentPlayerIndex];
        turnIndicator.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s Turn`;
        turnIndicator.style.color = currentPlayer;
    }

    function checkWinCondition(playerColor){
        const allFinished = pawnStates[playerColor].every(p => p.state === 'finished');
        if(allFinished){
            gameMessage.textContent = `${playerColor.toUpperCase()} wins the game! 🎉`;
            rollBtn.disabled = true;
            pawns.forEach(p => p.removeEventListener('click', movePawn));
        }
    }

    // --- Event Listeners ---
    rollBtn.addEventListener('click', rollDice);
    pawns.forEach(pawn => pawn.addEventListener('click', movePawn));

    // --- Start Game ---
    initializeGame();
});
