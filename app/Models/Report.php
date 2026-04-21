<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Report extends Model
{
    protected $fillable = [
        'reporter_id', 'reported_id', 'lfg_post_id', 'community_post_id', 'post_comment_id',
        'reason', 'details', 'status',
    ];

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function reported(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_id');
    }

    public function lfgPost(): BelongsTo
    {
        return $this->belongsTo(LfgPost::class);
    }

    public function communityPost(): BelongsTo
    {
        return $this->belongsTo(CommunityPost::class);
    }

    public function postComment(): BelongsTo
    {
        return $this->belongsTo(PostComment::class);
    }
}
