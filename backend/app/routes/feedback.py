"""
Feedback Route - User Correction and Scoring Adjustment
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ExtractedBlock, UserFeedback, BlockStatus, FeedbackAction
from app.schemas.schemas import FeedbackRequest, FeedbackResponse

router = APIRouter(prefix="/api", tags=["feedback"])


@router.post("/feedback", response_model=FeedbackResponse)
def submit_feedback(
    feedback: FeedbackRequest,
    db: Session = Depends(get_db)
):
    """
    Submit user feedback for a block.
    
    Actions:
    - accept: Mark block as accepted
    - reject: Mark block as rejected
    - modify: Update block language/type
    """
    # Get block
    block = db.query(ExtractedBlock).filter(
        ExtractedBlock.id == feedback.block_id
    ).first()
    
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    
    # Update block status
    if feedback.action == "accept":
        block.status = BlockStatus.ACCEPTED
    elif feedback.action == "reject":
        block.status = BlockStatus.REJECTED
    elif feedback.action == "modify":
        block.status = BlockStatus.MODIFIED
        if feedback.corrected_language:
            block.language = feedback.corrected_language
        if feedback.corrected_type:
            block.block_type = feedback.corrected_type
    
    # Record feedback
    user_feedback = UserFeedback(
        block_id=feedback.block_id,
        action=FeedbackAction(feedback.action),
        corrected_language=feedback.corrected_language,
        corrected_type=feedback.corrected_type
    )
    
    db.add(user_feedback)
    
    # Adjust confidence score based on feedback
    # This implements the feedback loop for scoring
    if feedback.action == "accept":
        # Boost confidence slightly
        block.confidence_score = min(0.99, block.confidence_score * 1.05)
    elif feedback.action == "reject":
        # Reduce confidence
        block.confidence_score *= 0.80
    
    db.commit()
    db.refresh(block)
    
    return FeedbackResponse(
        success=True,
        message=f"Feedback recorded: {feedback.action}",
        updated_confidence=block.confidence_score
    )


@router.get("/feedback/stats/{file_id}")
def get_feedback_stats(file_id: int, db: Session = Depends(get_db)):
    """Get feedback statistics for a file."""
    blocks = db.query(ExtractedBlock).filter(
        ExtractedBlock.file_id == file_id
    ).all()
    
    if not blocks:
        raise HTTPException(status_code=404, detail="No blocks found for this file")
    
    stats = {
        "total": len(blocks),
        "accepted": sum(1 for b in blocks if b.status == BlockStatus.ACCEPTED),
        "rejected": sum(1 for b in blocks if b.status == BlockStatus.REJECTED),
        "modified": sum(1 for b in blocks if b.status == BlockStatus.MODIFIED),
        "pending": sum(1 for b in blocks if b.status == BlockStatus.PENDING),
        "avg_confidence": sum(b.confidence_score for b in blocks) / len(blocks)
    }
    
    return stats
