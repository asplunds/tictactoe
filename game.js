document.addEventListener("DOMContentLoaded", game);

function game() {

    /**
     * Players, `1` is cross, `2` is ring and `0` is empty
     * @readonly
     */
    const players = {
        cross: 1,
        ring: 2
    }

    const size = 15;
    const winLength = 5;
    
    const statusElement = document.getElementById("game-status");
    const gameDiv = document.getElementById("game");

    for (let i = 0; i < size ** 2; i++) {
        const div = document.createElement("div");
        div.className = "tile";
        //div.innerHTML = i;
        gameDiv.appendChild(div);
    }

    const tiles = [...document.querySelectorAll("#game .tile")];

    gameDiv.style.setProperty("grid-template-columns", `repeat(${size}, 1fr)`);
    gameDiv.style.setProperty("grid-template-rows", `repeat(${size}, 1fr)`);
    gameDiv.style.setProperty("font-size", `calc(var(--size) / ${size} * .7)`);

    /**
     * Must only be mutated by function `mutateBoard` to avoid causing side effects
     * @readonly
     */
    let board = generateFreshBoard();
    
    /**
     * Must only be mutated by function `mutateTurn` to avoid causing side effects
     * @readonly
     */
    let turn = players.cross;

    /**
     * Must only be mutated by function `mutateStatus` to avoid causing side effects
     * @readonly
     */
    let status = "";

    /**
     * Creates an empty board
     */
    function generateFreshBoard() {
        return new Array(size).fill(0).map(() => new Array(size).fill(0));
    }

    /**
     * Render the given board state
     * @param {number[][]} board The board to render
     * @param {NodeList[]} tiles The tiles to render the board with
     */
    function updateBoard(board, tiles) {

        const conclusions = evalWinState(board);
        const concludedRanks = [];

        // Yield all concluded ranks/files
        for (const conclusion of conclusions)
            // Could be multiple ranks, flattened here since it's irrelevant for proceeding rendering iteration to know which rank each index belongs.
            concludedRanks.push(...(conclusion.rank ?? []));
        
        // iterate tiles and then render the state on each tile
        for (const [i, tile] of tiles.entries()) {
            const [x, y] = get2Dfrom1D(i, board);
            const tileState = board[x][y];

            // Reset class list by default
            tile.classList = ["tile"];

            console.log(concludedRanks)

            if (concludedRanks.includes(i))
                tile.classList.add("winner");

            tile.classList.add(
                tileState === players.cross ?
                    "cross" :
                tileState === players.ring ?
                    "ring" :
                    "empty" 
            );
        }
    }

    /**
     * Update the game status
     * @param {string} status The new status
     */
    function updateStatus(status) {
        return statusElement.innerText = status;
    }

    /**
     * Mutate the game status
     * @param {string} status The new status
     */
    function mutateStatus(status) {
        return status = status;
    }

    /**
     * Calculates the `x` and `y` position based off a linear 1D index.
     * @param {number} i The index as a 2D flattened array
     * @param {number[][]} arr The board to use as reference
     * @returns {[number, number]} [tuple] Coordinates
     */
    function get2Dfrom1D(i, arr) {
        let n = 0;
        for (let y = 0; y < arr.length; y++)
            for (let x = 0; x < arr[y].length; x++) {
                if (n === i)
                    return [x, y];
                n++;
            }
    }

    /**
     * Evaluate a move and return evaluated board
     * @param {number} player The player as number
     * @param {number[][]} board The board to make the move
     * @param {number} i The 1D index to place the player's move
     */
    function makeMove(player, board, i) {
        updateStatus(mutateStatus(""));

        let newBoard = board/* prevent ref */.slice(0);

        const conclusions = evalWinState(newBoard);

        for (const conclusion of conclusions)
            // Game over?
            if (conclusion?.player !== undefined) {
                updateStatus(mutateStatus(`New game, ${players.cross === turn ? "cross to move" : "ring to move"}`));
                return generateFreshBoard();
            }

        const [x, y] = get2Dfrom1D(i, board);

        // already placed?
        if (board[x][y] !== 0) return board;

        newBoard[x][y] = player;

        mutateTurn(toggleTurn(turn));

        return newBoard;
    }

    /**
     * Abstractation for mutating state. No functional program can bully fully non imperative.
     * However by using this entrypoint we can limit the potential side effects of mutating state.
     * @param {number[][]} [board] new board to be mutated
     */
    function mutateBoard(_board) {
        board = _board;

        const conclusions = evalWinState(_board);

        loopConclusions: for (const conclusion of conclusions)
            // Game over?
            if (conclusion?.player !== undefined /* important comparison since left side can be 0 */) {
                updateStatus(mutateStatus(
                    conclusion.player === players.cross ?
                        "Cross wins! Click anywhere to play again." :
                    conclusion.player === players.ring ?
                        "Ring wins! Click anywhere to play again." :
                        "It's a tie! Click anywhere to play again."
                ));
                
                // prevent tie being displayed if board is filled up and someone won
                if (conclusion.player !== 0)
                    break loopConclusions;
            }

        updateBoard(_board, tiles);
    }

    /**
     * Abstractation for mutating state. No functional program can bully fully non imperative.
     * However by using this entrypoint we can limit the potential side effects of mutating state.
     * @param {number} [turn] the new turn to replace the old
     */
    function mutateTurn(_turn) {
        turn = _turn;
    }

    /**
     * Toggles the turn
     * @returns {number} [turn] toggled turn
     */
    function toggleTurn(turn) {
        return turn === players.cross ? players.ring : players.cross;
    }

    const rows = Array(size)
        .fill(0)
        .map((v, n) => Array(size).fill(0).map((_, i) => i + n * size));

    const columns = Array(size)
        .fill(0)
        .map((v, n) => Array(size).fill(0).map((_, i) => n + i * size));

    const diags1 = Array(size)
        .fill(0)
        .map((v, n) => Array(size - n).fill(0).map((_, i) => (i) + (i) * size + size * (n)));

    const diags2 = Array(size - 1)
        .fill(0)
        .map((v, n) =>
            Array(size - n - 1)
                .fill(0).map((_, i) => (n + 1) + i * size + i)
        );

    const diags3 = Array(size)
        .fill(0)
        .map((v, n) =>
            Array(size - n)
                .fill(0).map((_, i, { length }) => size * length - size * (i + 1) + i)
        );

    const diags4 = Array(size - 1)
        .fill(0)
        .map((v, n) =>
            Array(size - n - 1)
                .fill(0).map((_, i, { length }) => size * (length - 1) + (n + 1) * size + (n + 1) - (size * i - i))
        );

    const diags = [...diags1, ...diags2, ...diags3, ...diags4];

    /**
     * Evaluate state and yield ranks of which a concluded state is evaluated
     * @param {number[][]} board The board to evaluate
     */
    function *evalWinState(board) {
        const flatRanks = [rows, columns, diags].flat();

        for (const rank of flatRanks) {
            const winningRank = [];
            const mappedRank = rank.map(i => {
                const [x, y] = get2Dfrom1D(i, board);

                if (board[x][y] !== 0)
                    winningRank.push([i, board[x][y]]);

                return board[x][y];
            });

            for (const player of Object.values(players)) {
                const playerRank = new Array(winLength).fill(player);

                if (mappedRank.join(",").includes(playerRank.join(",")))
                    {
                        console.log(player)
                        yield {
                        player, rank: winningRank
                            .filter(([, v]) => player === v).map(v => v[0])
                    }}
            }
        }

        // Yield draw unless some tile contains 0
        yield flatRanks.some(rank => {
            return rank.some(i => {
                const [x, y] = get2Dfrom1D(i, board);

                return board[x][y] === 0;
            });
        }) ? {} : {
            player: 0
        }
    }

    // Attach interactions
    for (const [i, tile] of tiles.entries())
        tile.addEventListener("click", () => {
            mutateBoard(makeMove(turn, board, i));
        });

}