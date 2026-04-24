<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Audit row for every games:import run kicked off from the admin
 * UI. Populated by RunGameImportJob as the artisan command runs so
 * admins can see progress without SSH'ing into the box.
 */
class GameImport extends Model
{
    protected $fillable = [
        'triggered_by_user_id',
        'label',
        'args',
        'status',
        'added',
        'updated',
        'skipped',
        'failed',
        'output',
        'error',
        'started_at',
        'finished_at',
    ];

    protected $casts = [
        'args' => 'array',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function triggeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'triggered_by_user_id');
    }
}
