<?php

namespace App\Notifications;

use App\Models\Product;
use Illuminate\Notifications\Notification;

class LowStockAlert extends Notification
{
    public function __construct(protected Product $product)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'product_id'   => $this->product->id,
            'product_name' => $this->product->name,
            'stock_qty'    => $this->product->stock_qty,
            'message'      => "Stock bas signalé pour « {$this->product->name} » ({$this->product->stock_qty} restant(s)).",
        ];
    }
}