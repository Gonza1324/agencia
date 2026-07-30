alter type public.account_movement_type
  add value if not exists 'prize_credit' after 'settlement_debt';
