alter type public.account_movement_type
  add value if not exists 'overpayment_credit' after 'prize_credit';
