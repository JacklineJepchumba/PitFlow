from app.services.ussd.handlers import normalize_phone, parse_sms_text


def test_parse_sms_ok():
    assert parse_sms_text("U014 2") == ("U014", 2)
    assert parse_sms_text("u3 1") == ("U3", 1)


def test_parse_sms_bad():
    assert parse_sms_text("hello") is None
    assert parse_sms_text("U014 9") is None


def test_normalize_phone():
    assert normalize_phone("0711000001") == "+254711000001"
    assert normalize_phone("254711000001") == "+254711000001"
