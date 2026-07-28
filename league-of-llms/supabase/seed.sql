-- Optional demo seed data — safe to run against a fresh dev project.
-- Gives the leaderboard and public feed something to show before real traffic arrives.

update public.leaderboard set wins = 142, losses = 61, elo_rating = 1387 where model_name = 'claude' and category = 'overall';
update public.leaderboard set wins = 138, losses = 70, elo_rating = 1362 where model_name = 'gpt' and category = 'overall';
update public.leaderboard set wins = 119, losses = 88, elo_rating = 1298 where model_name = 'gemini' and category = 'overall';
update public.leaderboard set wins = 96,  losses = 101, elo_rating = 1211 where model_name = 'grok' and category = 'overall';
update public.leaderboard set wins = 84,  losses = 110, elo_rating = 1178 where model_name = 'deepseek' and category = 'overall';
update public.leaderboard set wins = 71,  losses = 118, elo_rating = 1140 where model_name = 'mistral' and category = 'overall';

update public.leaderboard set wins = 88, losses = 40, elo_rating = 1355 where model_name = 'claude' and category = 'accuracy';
update public.leaderboard set wins = 80, losses = 45, elo_rating = 1330 where model_name = 'gpt' and category = 'accuracy';
update public.leaderboard set wins = 95, losses = 38, elo_rating = 1401 where model_name = 'gpt' and category = 'creativity';
update public.leaderboard set wins = 91, losses = 42, elo_rating = 1379 where model_name = 'claude' and category = 'helpfulness';
