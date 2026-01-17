# accounts/preprocessing.py
import re
from datetime import datetime

class EducationPreprocessor:
    """Handles preprocessing and encoding of education data"""
    
    # Degree encoding mapping
    DEGREE_ENCODING = {
        'B.Tech': 1, 'B.E.': 1, 'BE': 1,
        'B.Sc': 2, 'B.Sc.': 2,
        'B.A.': 3, 'BA': 3,
        'M.Tech': 4, 'M.E.': 4, 'ME': 4,
        'M.Sc': 5, 'M.Sc.': 5,
        'MBA': 6,
        'Ph.D': 7, 'PhD': 7,
        'Other': 0
    }
    
    # Specialization categories
    SPECIALIZATION_CATEGORIES = {
        # Computer Science & IT
        'computer science': 101, 'cs': 101, 'cse': 101,
        'artificial intelligence': 102, 'ai': 102, 'ai/ml': 102,
        'machine learning': 102,
        'data science': 103, 'data analytics': 103,
        'information technology': 104, 'it': 104,
        'software engineering': 105,
        'cyber security': 106,
        
        # Engineering
        'electrical': 201, 'eee': 201,
        'electronics': 202, 'ece': 202,
        'mechanical': 203,
        'civil': 204,
        'chemical': 205,
        
        # Business & Management
        'business administration': 301,
        'finance': 302,
        'marketing': 303,
        'human resources': 304, 'hr': 304,
        
        # Sciences
        'mathematics': 401,
        'physics': 402,
        'chemistry': 403,
        'biology': 404,
    }
    
    # Tier 1 universities (Indian context)
    TIER_1_UNIVERSITIES = [
        'indian institute of technology', 'iit',
        'indian institute of management', 'iim',
        'bits pilani', 'birla institute',
        'delhi technological university', 'dtu',
        'netaji subhas university', 'nsut',
    ]
    
    # Tier 2 universities
    TIER_2_UNIVERSITIES = [
        'nit', 'national institute of technology',
        'vit', 'vellore institute',
        'srm', 'manipal',
        'amity', 'lovely professional', 'lpu',
        'chandigarh university',
    ]
    
    @classmethod
    def standardize_degree(cls, degree):
        """Standardize degree names"""
        if not degree or not isinstance(degree, str):
            return 'Other'
        
        degree_lower = degree.strip().lower()
        
        # Mapping variations
        degree_mapping = {
            'btech': 'B.Tech', 'b.tech': 'B.Tech', 'bachelor of technology': 'B.Tech',
            'be': 'B.E.', 'b.e.': 'B.E.', 'bachelor of engineering': 'B.E.',
            'bsc': 'B.Sc', 'b.sc': 'B.Sc', 'bachelor of science': 'B.Sc',
            'ba': 'B.A.', 'b.a.': 'B.A.', 'bachelor of arts': 'B.A.',
            'mtech': 'M.Tech', 'm.tech': 'M.Tech', 'master of technology': 'M.Tech',
            'msc': 'M.Sc', 'm.sc': 'M.Sc', 'master of science': 'M.Sc',
            'mba': 'MBA', 'master of business administration': 'MBA',
            'phd': 'Ph.D', 'ph.d': 'Ph.D', 'doctor of philosophy': 'Ph.D',
        }
        
        for key, value in degree_mapping.items():
            if key in degree_lower:
                return value
        
        # If no match, capitalize first letter of each word
        return degree.strip().title()
    
    @classmethod
    def standardize_specialization(cls, specialization):
        """Clean and standardize specialization"""
        if not specialization or not isinstance(specialization, str):
            return 'General'
        
        specialization = specialization.strip().title()
        
        # Remove common prefixes/suffixes
        replacements = [
            (' In ', ' in '),
            (' And ', ' and '),
            (' & ', ' and '),
            (' Engineering', ''),
            (' Technology', ''),
            (' Science', ''),
            (' Studies', ''),
        ]
        
        for old, new in replacements:
            specialization = specialization.replace(old, new)
        
        return specialization
    
    @classmethod
    def clean_university(cls, university):
        """Clean and standardize university name"""
        if not university or not isinstance(university, str):
            return 'Not Specified'
        
        university = university.strip()
        
        # Expand common abbreviations
        abbreviations = {
            'iit': 'Indian Institute of Technology',
            'iim': 'Indian Institute of Management',
            'nit': 'National Institute of Technology',
            'du': 'University of Delhi',
            'mu': 'University of Mumbai',
            'cu': 'University of Calcutta',
            'bu': 'University of Bangalore',
            'pu': 'University of Pune',
            'lpu': 'Lovely Professional University',
            'vit': 'Vellore Institute of Technology',
            'srm': 'SRM Institute of Science and Technology',
            'amu': 'Aligarh Muslim University',
            'jnu': 'Jawaharlal Nehru University',
        }
        
        # Check for abbreviations
        university_lower = university.lower()
        for abbr, full_name in abbreviations.items():
            if abbr in university_lower:
                return full_name
        
        # Capitalize properly
        return university.title()
    
    @classmethod
    def normalize_cgpa(cls, cgpa):
        """Normalize CGPA to 10.0 scale"""
        try:
            if isinstance(cgpa, str):
                # Remove non-numeric characters except decimal point
                cgpa = re.sub(r'[^\d.]', '', cgpa)
            
            cgpa_float = float(cgpa)
            
            # Handle different scales
            if cgpa_float > 10.0 and cgpa_float <= 100.0:
                # Percentage or 100 scale
                cgpa_float = cgpa_float / 10.0
            elif cgpa_float > 4.0 and cgpa_float <= 5.0:
                # 5.0 scale
                cgpa_float = (cgpa_float / 5.0) * 10.0
            elif cgpa_float > 1.0 and cgpa_float <= 4.0:
                # 4.0 scale (US)
                cgpa_float = (cgpa_float / 4.0) * 10.0
            
            # Round to 2 decimal places
            return round(cgpa_float, 2)
        except (ValueError, TypeError):
            return 0.0
    
    @classmethod
    def get_university_tier(cls, university):
        """Determine university tier (1, 2, or 3)"""
        if not university or not isinstance(university, str):
            return 3
        
        university_lower = university.lower()
        
        for tier1 in cls.TIER_1_UNIVERSITIES:
            if tier1 in university_lower:
                return 1
        
        for tier2 in cls.TIER_2_UNIVERSITIES:
            if tier2 in university_lower:
                return 2
        
        return 3
    
    @classmethod
    def encode_education_data(cls, education_data):
        """Encode education data for ML"""
        encoded = {
            'degree_code': cls.DEGREE_ENCODING.get(
                education_data.get('degree', 'Other'), 0
            ),
            'specialization_code': 0,
            'cgpa_10_scale': cls.normalize_cgpa(education_data.get('cgpa', 0)),
            'years_since_graduation': 0,
            'university_tier': 3,
        }
        
        # Encode specialization
        specialization = education_data.get('specialization', '').lower()
        for key, code in cls.SPECIALIZATION_CATEGORIES.items():
            if key in specialization:
                encoded['specialization_code'] = code
                break
        
        # Calculate years since graduation
        year = education_data.get('year_of_completion')
        if year:
            current_year = datetime.now().year
            encoded['years_since_graduation'] = max(0, current_year - year)
        
        # Get university tier
        university = education_data.get('university', '')
        encoded['university_tier'] = cls.get_university_tier(university)
        
        return encoded