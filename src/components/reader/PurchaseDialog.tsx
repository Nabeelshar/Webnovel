
import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";

interface PurchaseDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  chapterNumber: number;
  chapterTitle: string;
  coinCost: number;
  userCoins: number;
  onPurchase: () => Promise<void>;
}

const PurchaseDialog = ({
  open,
  setOpen,
  chapterNumber,
  chapterTitle,
  coinCost,
  userCoins,
  onPurchase
}: PurchaseDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Purchase Chapter</DialogTitle>
          <DialogDescription>
            You're about to purchase Chapter {chapterNumber}: {chapterTitle}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex justify-between mb-2">
            <span>Your balance:</span>
            <span className="font-semibold">{userCoins} coins</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Chapter cost:</span>
            <span className="font-semibold">{coinCost} coins</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between">
            <span>Balance after purchase:</span>
            <span className="font-semibold">{userCoins - coinCost} coins</span>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={onPurchase}
            disabled={userCoins < coinCost}
          >
            Confirm Purchase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDialog;
