export class ChessBoard {

    static readonly VALID_PIECES = new Set('rnbkqpRNBKQP'.split(''));

    private board: string[][];
    private activeColor: string;
    private canCastle: Set<string>;
    private enPassantTargetSquare: string;
    private halfMoveClock: number;
    private fullMoveNumber: number;

    private constructor(otherBoard: string[][], activeColor: string, canCastle: Set<string>, 
                        enPassantTargetSquare: string, halfMoveClock: number, fullMoveNumber: number) {
        this.board = otherBoard;
        this.activeColor = activeColor;
        this.canCastle = canCastle;
        this.enPassantTargetSquare = enPassantTargetSquare;
        this.halfMoveClock = halfMoveClock;
        this.fullMoveNumber = fullMoveNumber;
    }

    // Returns a copy of the internal representation array.
    public toArray(): string[][] {
        return JSON.parse(JSON.stringify(this.board));
    }

    public static fromFEN(fen: string): ChessBoard {
        const sections = fen.split(' ');
        if (sections.length !== 6) {
            throw 'Invalid FEN';
        }

        const [fenBoard, activeColor, castlingAvailability, enPassantTargetSquare, halfMoveClock, fullMoveNumber] = sections;

        // Process fenBoard
        const splitBoard = fenBoard.split('/');
        if (splitBoard.length !== 8) {
            throw 'Invalid FEN board';
        }
        const arrayBoard = splitBoard.map((row) => {
            const cols = row.split('');
            const ret = cols.reduce<string[]>((acc, col) => {
                if (this.VALID_PIECES.has(col)) {
                    acc.push(col);
                } else {
                    try {
                        const num = parseInt(col);
                        if (num < 1 || num > 8) {
                            throw 'Bad Num In FEN';
                        }
                        acc.push(...Array(num).fill(''));
                    } catch(err) {
                        throw `Invalid FEN line: ${row}`;
                    }
                }
                return acc;
            }, []);
            if (ret.length !== 8) {
                throw `Wrong length FEN line: ${row} - ${ret.length}`;
            }
            return ret;
        });

        // Process activeColor
        if (activeColor !== 'w' && activeColor !== 'b') {
            throw 'Invalid FEN active color';
        }

        // Process castlingAvailability
        const canCastle = new Set<string>();
        if (castlingAvailability !== '-') {
            if (!/^K?Q?k?q?$/.test(castlingAvailability)) {
                throw 'Invalid FEN castling availability';
            }
            castlingAvailability.split('').forEach((elem) => {
                canCastle.add(elem);
            })
        }

        // Process enPassantTargetSquare
        if (enPassantTargetSquare !== '-' && !/^[abcdefgh][36]$/.test(enPassantTargetSquare)) {
            throw 'Invalid FEN en passant target square';
        }

        // Process halfMoveClock
        let numHalfMoveClock = 0;
        try {
            numHalfMoveClock = parseInt(halfMoveClock);
            if (numHalfMoveClock < 0) {
                throw 'Invalid FEN halfmove clock';
            }
        } catch(err) {
            throw 'Invalid FEN halfmove clock';
        }


        // Process fullMoveNumber
        let numFullMoveNumber = 0;
        try {
            numFullMoveNumber = parseInt(fullMoveNumber);
            if (numFullMoveNumber < 1) {
                throw 'Invalid FEN fullmove number';
            }
        } catch(err) {
            throw 'Invalid FEN fullmove number';
        }


        return new ChessBoard(arrayBoard, activeColor, canCastle, enPassantTargetSquare, numHalfMoveClock, numFullMoveNumber);
    }


    public toFEN(): string {
        const fenBoard = this.board.map((row) => {
            let numSpaces = 0;
            return row.reduce<string>((acc, col, idx) => {
                if (col === '') {
                    numSpaces++;
                    if (idx === 7) {
                        acc += numSpaces;
                    }
                } else {
                    if (numSpaces) {
                        acc += numSpaces;
                        numSpaces = 0;
                    }
                    acc += col;
                }
                return acc;
            }, '');
        }).join('/');

        const strCanCastle = this.canCastle.size == 0 ? '-' : [...this.canCastle].sort().join('');

        return `${fenBoard} ${this.activeColor} ${strCanCastle} ${this.enPassantTargetSquare ?? '-'} ${this.halfMoveClock} ${this.fullMoveNumber}`;
    }

    // Generates a compressed base-64 of the board.
    /*
    public toBase64(): string {
        const bitVector = this.board.reduce<



        return '';

    }
*/

}