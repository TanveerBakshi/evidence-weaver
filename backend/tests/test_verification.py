"""
Tests for the citation verification step.

Claude is asked to return an exact quote from the witness statement as
evidence for its verdict. Before we trust the verdict we string-match that
quote back into the source text. If it isn't there, the model may have
paraphrased or hallucinated it, so the verdict is downgraded to UNVERIFIED.
"""
import json

import pytest

from services import pleading_generator
from services.document_parser import ParsedDocument
from services.pleading_generator import (
    HORIZON_PLEADINGS,
    classify_witness_against_pleading,
    verify_quote,
)

SOURCE_TEXT = """
Witness Name: Roderick Mark Ismay
Statement No.: WITN04630100

12. I don't recall that there were serious concerns within POL
management about the integrity of the Horizon system at that time.
"""

REAL_QUOTE = (
    "I don't recall that there were serious concerns within POL management "
    "about the integrity of the Horizon system at that time."
)
FAKE_QUOTE = "Senior management knew Horizon was unreliable and hid it."

# Allegation 6: senior management knew Horizon was unreliable
MANAGEMENT_ALLEGATION = next(a for a in HORIZON_PLEADINGS if a["id"] == 6)


@pytest.fixture
def document():
    return ParsedDocument(
        filename="WITN04630100.pdf",
        witness_name="Roderick Mark Ismay",
        statement_number="WITN04630100",
        date="Unknown",
        raw_text=SOURCE_TEXT,
        pages=1,
    )


def mock_claude(monkeypatch, verdict: str, passage):
    """Replace the real Claude call with a canned JSON response."""
    response = json.dumps({
        "verdict": verdict,
        "confidence": "HIGH",
        "relevant_passage": passage,
        "paragraph_ref": "12",
        "reasoning": "test",
    })
    monkeypatch.setattr(pleading_generator, "call_claude", lambda **kwargs: response)


# --- verify_quote: the string-match check itself ---

def test_verify_quote_finds_exact_quote():
    assert verify_quote(REAL_QUOTE, SOURCE_TEXT)


def test_verify_quote_ignores_line_breaks_and_case():
    # PDF extraction breaks lines mid-sentence; the model returns one line
    assert verify_quote(REAL_QUOTE.upper(), SOURCE_TEXT)


def test_verify_quote_rejects_quote_not_in_source():
    assert not verify_quote(FAKE_QUOTE, SOURCE_TEXT)


@pytest.mark.parametrize("empty", [None, ""])
def test_verify_quote_rejects_empty_quote(empty):
    assert not verify_quote(empty, SOURCE_TEXT)


# --- classify_witness_against_pleading: verdict handling end to end ---

def test_verdict_with_real_citation_is_kept(monkeypatch, document):
    mock_claude(monkeypatch, "CONTRADICTS", REAL_QUOTE)

    result = classify_witness_against_pleading(MANAGEMENT_ALLEGATION, document)

    assert result["verdict"] == "CONTRADICTS"
    assert result["verified"] is True
    assert result["relevant_passage"] == REAL_QUOTE
    assert result["confidence"] == "HIGH"


def test_verdict_with_hallucinated_citation_is_downgraded(monkeypatch, document):
    mock_claude(monkeypatch, "SUPPORTS", FAKE_QUOTE)

    result = classify_witness_against_pleading(MANAGEMENT_ALLEGATION, document)

    assert result["verdict"] == "UNVERIFIED"
    assert result["verified"] is False
    assert result["relevant_passage"] is None
    assert result["confidence"] == "LOW"


def test_not_addressed_needs_no_citation(monkeypatch, document):
    mock_claude(monkeypatch, "NOT_ADDRESSED", None)

    result = classify_witness_against_pleading(MANAGEMENT_ALLEGATION, document)

    assert result["verdict"] == "NOT_ADDRESSED"
    assert result["verified"] is True
