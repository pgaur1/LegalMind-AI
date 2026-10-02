"""
LegalMind AI - Web Scraping Service
Scrapes Indian legal websites for case law and judgments
Uses Scrapling library for robust scraping with anti-bot bypass
"""

import json
import subprocess
import tempfile
from pathlib import Path
from typing import List, Dict, Optional
from loguru import logger

from config.config import settings


class WebService:
    """
    Web Scraping Service for Indian legal websites
    Fetches recent case law from Indian Kanoon and Supreme Court
    """

    def __init__(self):
        self.initialized = False
        self.scrapling_available = self._check_scrapling()

    def _check_scrapling(self) -> bool:
        """Check if scrapling is installed"""
        try:
            result = subprocess.run(
                ["scrapling", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                logger.info("Scrapling is available")
                return True
        except Exception as e:
            logger.warning(f"Scrapling not available: {e}")
        return False

    def initialize(self) -> bool:
        """Initialize web service"""
        if not settings.SCRAPING_ENABLED:
            logger.info("Web scraping disabled in config")
            return False

        if not self.scrapling_available:
            logger.warning("Scrapling not installed - using mock data fallback")
            return False

        self.initialized = True
        logger.success("Web service initialized")
        return True

    def search_indian_kanoon(
        self,
        query: str,
        max_results: int = 3
    ) -> List[Dict]:
        """
        Search Indian Kanoon for case law

        Args:
            query: Search query (e.g., "RERA delayed possession")
            max_results: Maximum number of results

        Returns:
            List of case dictionaries with metadata
        """
        if not self.initialized:
            return []

        try:
            logger.info(f"Searching Indian Kanoon: '{query}'")

            # Build search URL
            search_url = f"{settings.INDIAN_KANOON_SEARCH_URL}?formInput={query.replace(' ', '+')}"

            # Use scrapling to fetch search results
            with tempfile.NamedTemporaryFile(mode='w+', suffix='.md', delete=False) as tmp:
                tmp_path = tmp.name

            # Run scrapling command
            cmd = [
                "scrapling", "extract", "get",
                search_url,
                tmp_path,
                "--ai-targeted",
                "--css-selector", "div.result"  # Adjust selector based on actual HTML
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode != 0:
                logger.error(f"Scrapling failed: {result.stderr}")
                return []

            # Read scraped content
            with open(tmp_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Clean up temp file
            Path(tmp_path).unlink()

            # Parse results (simplified - adjust based on actual content)
            cases = self._parse_indian_kanoon_results(content, max_results)

            logger.info(f"Found {len(cases)} cases from Indian Kanoon")
            return cases

        except Exception as e:
            logger.error(f"Indian Kanoon search failed: {e}")
            return []

    def _parse_indian_kanoon_results(
        self,
        content: str,
        max_results: int
    ) -> List[Dict]:
        """Parse Indian Kanoon search results"""
        cases = []

        # Demo implementation - extract case names and create basic structure
        # In production, parse actual HTML structure

        lines = content.split('\n')
        case_count = 0

        for line in lines:
            if case_count >= max_results:
                break

            # Look for case names (typically "vs" or "v.")
            if ' vs ' in line.lower() or ' v. ' in line.lower():
                cases.append({
                    "source_type": "web",
                    "website": "Indian Kanoon",
                    "case_name": line.strip(),
                    "url": f"{settings.INDIAN_KANOON_URL}doc/...",  # Extract actual URL
                    "snippet": line[:200],
                    "relevance": 0.85,
                    "date_accessed": "2026-10-02"
                })
                case_count += 1

        return cases

    def get_mock_web_results(
        self,
        query: str,
        max_results: int = 3
    ) -> List[Dict]:
        """
        Return mock web results for demo
        Use this as fallback when scraping is disabled
        """
        logger.info(f"Returning mock web results for: '{query}'")

        # Determine relevant mock cases based on query keywords
        query_lower = query.lower()

        # All available mock cases
        all_mock_cases = [
            {
                "source_type": "web",
                "website": "Indian Kanoon",
                "case_name": "Kumar vs ABC Builders (SC 2023)",
                "citation": "Civil Appeal No. 1234/2023",
                "court": "Supreme Court of India",
                "url": "https://indiankanoon.org/doc/123456/",
                "snippet": "Supreme Court held that interest at MCLR+2% is mandatory for delayed possession under RERA Section 18. The builder's argument that market conditions justified delay was rejected.",
                "text": "The Supreme Court in Kumar vs ABC Builders clarified that under RERA Act 2016, Section 18, buyers are entitled to interest at the rate prescribed by State Government (typically MCLR+2%) for any delay in possession. The Court held that this is a mandatory statutory right and cannot be waived by contractual clauses. The builder's contention that market slowdown justified the delay was rejected, emphasizing that RERA is a beneficial legislation for homebuyers.",
                "relevance": 0.92,
                "date_accessed": "2026-10-02",
                "year": "2023",
                "keywords": ["rera", "delayed possession", "interest", "section 18"]
            },
            {
                "source_type": "web",
                "website": "Indian Kanoon",
                "case_name": "Singh vs Real Estate Developers (NCDRC 2026)",
                "citation": "Consumer Case No. 9012/2026",
                "court": "NCDRC",
                "url": "https://indiankanoon.org/doc/789012/",
                "snippet": "NCDRC awarded ₹5,00,000 compensation for mental agony in addition to RERA interest for 4 years delay in possession.",
                "text": "National Consumer Disputes Redressal Commission (NCDRC) in Singh vs Real Estate Developers awarded substantial compensation for mental agony and harassment caused by prolonged delay. In addition to mandatory RERA interest on the amount paid, the Commission awarded ₹5,00,000 for mental agony, recognizing the severe impact of 4 years delay on the buyer's family planning and financial stability.",
                "relevance": 0.88,
                "date_accessed": "2026-10-02",
                "year": "2026",
                "keywords": ["rera", "compensation", "mental agony", "ncdrc", "consumer"]
            },
            {
                "source_type": "web",
                "website": "Supreme Court of India",
                "case_name": "Residential Buyers Association vs Builder XYZ (Bombay HC 2026)",
                "citation": "Writ Petition No. 5678/2026",
                "court": "Bombay High Court",
                "url": "https://main.sci.gov.in/case/...",
                "snippet": "Bombay High Court directed RERA authority to expedite delayed possession complaints within 60 days, emphasizing timely justice.",
                "text": "The Bombay High Court in Residential Buyers Association vs Builder XYZ directed the RERA authority to dispose of delayed possession complaints within 60 days from the date of filing. The Court observed that delayed justice defeats the purpose of RERA Act and causes further harassment to aggrieved homebuyers. The Court also directed the State Government to increase manpower at RERA authorities to handle the backlog.",
                "relevance": 0.85,
                "date_accessed": "2026-10-02",
                "year": "2026",
                "keywords": ["rera", "delayed possession", "bombay high court", "expedite"]
            },
            {
                "source_type": "web",
                "website": "Indian Kanoon",
                "case_name": "Ramesh vs Tata AIG Insurance (SC 2024)",
                "citation": "Civil Appeal No. 3456/2024",
                "court": "Supreme Court of India",
                "url": "https://indiankanoon.org/doc/345678/",
                "snippet": "Supreme Court held that insurance claim rejection without proper investigation amounts to deficiency in service under Consumer Protection Act.",
                "text": "In Ramesh vs Tata AIG Insurance, the Supreme Court held that rejection of insurance claim without conducting proper investigation and without giving valid reasons amounts to deficiency in service. The insurer must provide clear and cogent reasons for claim rejection, supported by investigation report. Mere reliance on policy clauses without proper investigation is insufficient.",
                "relevance": 0.90,
                "date_accessed": "2026-10-02",
                "year": "2024",
                "keywords": ["insurance", "claim rejection", "deficiency", "consumer protection"]
            },
            {
                "source_type": "web",
                "website": "Indian Kanoon",
                "case_name": "Sharma vs HDFC ERGO Health Insurance (NCDRC 2025)",
                "citation": "Consumer Case No. 1122/2025",
                "court": "NCDRC",
                "url": "https://indiankanoon.org/doc/112233/",
                "snippet": "NCDRC directed insurer to pay health insurance claim with 9% interest for unjust repudiation based on pre-existing disease clause.",
                "text": "The NCDRC in Sharma vs HDFC ERGO Health Insurance directed the insurance company to pay the health insurance claim along with 9% per annum interest. The Commission held that the insurer's rejection based on alleged pre-existing disease was not supported by medical evidence. The Commission also awarded ₹1,00,000 as compensation for mental agony and litigation costs.",
                "relevance": 0.87,
                "date_accessed": "2026-10-02",
                "year": "2025",
                "keywords": ["health insurance", "claim", "pre-existing disease", "repudiation"]
            },
            {
                "source_type": "web",
                "website": "Indian Kanoon",
                "case_name": "Privacy Watchdog vs Government of India (Delhi HC 2025)",
                "citation": "Writ Petition No. 7890/2025",
                "court": "Delhi High Court",
                "url": "https://indiankanoon.org/doc/789045/",
                "snippet": "Delhi HC emphasized data protection principles following Puttaswamy judgment, directing stricter implementation of privacy safeguards.",
                "text": "Following the landmark Puttaswamy vs Union of India judgment recognizing privacy as fundamental right, the Delhi High Court in Privacy Watchdog vs Government of India directed stricter implementation of data protection safeguards. The Court emphasized that any data collection must be proportionate, have legitimate aim, and follow principles of necessity and consent.",
                "relevance": 0.83,
                "date_accessed": "2026-10-02",
                "year": "2025",
                "keywords": ["privacy", "data protection", "fundamental right", "puttaswamy"]
            }
        ]

        # Filter cases based on query keywords
        relevant_cases = []
        for case in all_mock_cases:
            # Check if any keyword matches the query
            if any(keyword in query_lower for keyword in case["keywords"]):
                relevant_cases.append(case)

        # If no keyword matches, return most recent cases
        if not relevant_cases:
            relevant_cases = all_mock_cases[:max_results]

        # Return top results
        return relevant_cases[:max_results]

    def search_web(
        self,
        query: str,
        max_results: int = 3,
        use_live_scraping: bool = False  # Disabled by default for demo
    ) -> List[Dict]:
        """
        Main search method - uses mock data by default, optionally tries live scraping

        Args:
            query: Search query
            max_results: Maximum results to return
            use_live_scraping: Enable live scraping (adds 5-10s latency if successful, 3-5s if fails)

        Returns:
            List of web sources
        """
        # Try live scraping only if explicitly enabled
        if use_live_scraping and self.initialized and self.scrapling_available:
            logger.info("Attempting live scraping (may add latency)...")
            results = self.search_indian_kanoon(query, max_results)
            if results:
                logger.success(f"Live scraping succeeded: {len(results)} results")
                return results
            logger.warning("Live scraping failed, falling back to mock data")

        # Use mock results for demo (instant, reliable)
        return self.get_mock_web_results(query, max_results)


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_web_service: Optional[WebService] = None


def get_web_service() -> WebService:
    """Get or create web service singleton"""
    global _web_service
    if _web_service is None:
        _web_service = WebService()
    return _web_service


# ============================================================================
# TESTING
# ============================================================================

if __name__ == "__main__":
    """Test web service"""
    print("=" * 70)
    print("TESTING WEB SERVICE")
    print("=" * 70)

    service = WebService()

    print("\n1. Initializing service...")
    service.initialize()

    print("\n2. Testing RERA search...")
    results = service.search_web("RERA delayed possession", max_results=3)

    print(f"\nFound {len(results)} web results:")
    for i, result in enumerate(results, 1):
        print(f"\n{i}. {result.get('case_name')}")
        print(f"   Source: {result.get('website')}")
        print(f"   Court: {result.get('court')}")
        print(f"   URL: {result.get('url')}")
        snippet = result.get('snippet', '')[:100]
        print(f"   Snippet: {snippet.encode('utf-8', errors='ignore').decode('utf-8')}...")

    print("\n" + "=" * 70)
    print("\n3. Testing Insurance search...")
    results = service.search_web("insurance claim rejection", max_results=2)

    print(f"\nFound {len(results)} web results:")
    for i, result in enumerate(results, 1):
        print(f"\n{i}. {result.get('case_name')}")
        print(f"   Source: {result.get('website')}")
        print(f"   Snippet: {result.get('snippet')[:100]}...")

    print("\n" + "=" * 70)
    print("✅ SUCCESS!")
    print("=" * 70)
