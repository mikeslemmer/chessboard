export class ChessBoard {

    static readonly VALID_PIECES = new Set('rnbkqpRNBKQP'.split(''));
    static readonly COLS_TO_LETTERS = 'abcdefgh'.split('');

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
                if (ChessBoard.VALID_PIECES.has(col)) {
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
    
    public toBase64(): string {
        let pieces: number[] = [];
        let firstNibble = true;
        const bitVector: number[] = this.board.map((row, i) => {
            let ret = 0;
            for (let j = 0, bit = 1; j < 8; j++, bit <<= 1) {
                const col = row[j];
                if (col !== '') {
                    ret |= bit;
                    let pieceCode: number;
                    switch(col) {
                        case 'P':
                            if (i === 4 && this.enPassantTargetSquare === `${ChessBoard.COLS_TO_LETTERS[j]}3`) {
                                pieceCode = 12;
                            } else {
                                pieceCode = 0;
                            } 
                            break;
                        case 'p':
                            if (i === 3 && this.enPassantTargetSquare === `${ChessBoard.COLS_TO_LETTERS[j]}6`) {
                                pieceCode = 12;
                            } else {
                                pieceCode = 1;
                            } 
                            break;
                        case 'N':   pieceCode = 2; break;
                        case 'n':   pieceCode = 3; break;
                        case 'B':   pieceCode = 4; break;
                        case 'b':   pieceCode = 5; break;
                        case 'R':
                            if (i === 7 && (j === 0 && this.canCastle.has('Q')) || j === 7 && this.canCastle.has('K'))  {
                                pieceCode = 13;
                            } else {
                                pieceCode = 6;
                            }
                            break;
                        case 'r':   
                            if (i === 0 && (j === 0 && this.canCastle.has('q')) || j === 7 && this.canCastle.has('k'))  {
                                pieceCode = 14;
                            } else {
                                pieceCode = 7;
                            }
                            break;
                        case 'Q':   pieceCode = 8; break;
                        case 'q':   pieceCode = 9; break;
                        case 'K':   pieceCode = 10; break;
                        case 'k':   pieceCode = (this.activeColor === 'b') ? 15 : 11; break;
                        default:    throw `toBase64: Invalid piece found in row: ${row}`
                    }
                    if (firstNibble) {
                        pieces.push(pieceCode);
                    } else {
                        pieces[pieces.length - 1] |= pieceCode << 4;
                    }
                    firstNibble = !firstNibble;
                }
            }
            return ret;
        });

        return Buffer.from([...bitVector, ...pieces]).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
    }


    public static fromBase64(base64Str: string): ChessBoard {
        const buffer = Buffer.from(base64Str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (base64Str.length % 4)) % 4), 'base64');
        const board: string[][] = [];
        const canCastle = new Set<string>();
        let activeColor = 'w';
        let pieceNum = 0;
        let enPassantTargetSquare = '-';
        for (let i = 0; i < 8; i++) {
            board.push(Array(8).fill(''));
            for (let j = 0; j < 8; j++) {
                if (buffer[i] & (1 << j)) {
                    let pieceCode = buffer[8 + Math.floor(pieceNum / 2)];
                    if (pieceNum & 1) {
                        pieceCode >>= 4;
                    } else {
                        pieceCode &= 15;
                    }
                    pieceNum++;
                    let piece = '';
                    switch(pieceCode) {
                        case 0:     piece = 'P'; break;
                        case 1:     piece = 'p'; break;
                        case 2:     piece = 'N'; break;
                        case 3:     piece = 'n'; break;
                        case 4:     piece = 'B'; break;
                        case 5:     piece = 'b'; break;
                        case 6:     piece = 'R'; break;
                        case 7:     piece = 'r'; break;
                        case 8:     piece = 'Q'; break;
                        case 9:     piece = 'q'; break;
                        case 10:    piece = 'K'; break;
                        case 11:    piece = 'k'; break;
                        case 12:    
                            if (i === 3) {
                                enPassantTargetSquare = `${ChessBoard.COLS_TO_LETTERS[j]}6`;
                                piece = 'p';
                            } else { // i === 5
                                enPassantTargetSquare = `${ChessBoard.COLS_TO_LETTERS[j]}3`;
                                piece = 'P';
                            }
                            break;
                        case 13:    piece = 'R'; canCastle.add(j === 0 ? 'Q' : 'K'); break;
                        case 14:    piece = 'r'; canCastle.add(j === 0 ? 'q' : 'k'); break;
                        case 15:    piece = 'k'; activeColor = 'b'; break;
                    }
                    board[i][j] = piece;
                    
                }         
            }
        }

        return new ChessBoard(board, activeColor, canCastle, enPassantTargetSquare, 0, 1);
    }

}