<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PageView extends Model
{
    public $timestamps = false;

    protected $fillable = ['path', 'day', 'visitor_hash', 'created_at'];

    protected function casts(): array
    {
        return [
            'day' => 'date:Y-m-d',
            'created_at' => 'datetime',
        ];
    }
}
