import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser, Check } from 'lucide-react';

interface SignaturePadProps {
    onCapture: (signatureData: string) => void;
    onCancel?: () => void;
    width?: number;
    height?: number;
}

const SignaturePad = ({ onCapture, onCancel, width = 400, height = 200 }: SignaturePadProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set up canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    const getPosition = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if ('touches' in e) {
            const touch = e.touches[0];
            return {
                x: (touch.clientX - rect.left) * scaleX,
                y: (touch.clientY - rect.top) * scaleY,
            };
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    }, []);

    const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        const pos = getPosition(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        setIsDrawing(true);
        setHasSignature(true);
    }, [getPosition]);

    const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        const pos = getPosition(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }, [isDrawing, getPosition]);

    const stopDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setIsDrawing(false);
    }, []);

    const clear = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
    }, []);

    const handleCapture = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !hasSignature) return;
        const data = canvas.toDataURL('image/png');
        onCapture(data);
    }, [hasSignature, onCapture]);

    return (
        <div className="space-y-3">
            <div className="text-sm font-medium text-slate-700 mb-1">
                Signature du client
            </div>
            <div className="border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-white">
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    className="w-full touch-none cursor-crosshair"
                    style={{ maxWidth: width }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>
            <p className="text-xs text-slate-500 text-center">
                Signez dans la zone ci-dessus avec votre doigt ou souris
            </p>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clear} className="flex-1">
                    <Eraser className="w-4 h-4 mr-1" />
                    Effacer
                </Button>
                {onCancel && (
                    <Button variant="outline" size="sm" onClick={onCancel} className="flex-1">
                        Annuler
                    </Button>
                )}
                <Button
                    size="sm"
                    onClick={handleCapture}
                    disabled={!hasSignature}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                >
                    <Check className="w-4 h-4 mr-1" />
                    Valider
                </Button>
            </div>
        </div>
    );
};

export default SignaturePad;
