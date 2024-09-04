import { ChessBoard } from './ChessBoard';

describe('FEN Import / Export', () => {
    it('should handle the starting position', () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const board = ChessBoard.fromFEN(fen);
        const arr = board.toArray();
        expect(arr[0][0]).toBe('r');
        expect(arr[1][1]).toBe('p');
        expect(arr[2][2]).toBe('');
        expect(arr[6][6]).toBe('P');
        expect(arr[7][7]).toBe('R');

        expect(board.toFEN()).toBe(fen);
    });

    it('should handle some common situations', () => {
        {
            const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
            const board = ChessBoard.fromFEN(fen);
            expect(board.toFEN()).toBe(fen);
        }
        {
            const fen = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2';
            const board = ChessBoard.fromFEN(fen);
            expect(board.toFEN()).toBe(fen);
        }
        {
            const fen = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2';
            const board = ChessBoard.fromFEN(fen);
            expect(board.toFEN()).toBe(fen);
        }
    });

});