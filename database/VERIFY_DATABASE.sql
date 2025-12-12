SELECT 'news_feed' as table_name, COUNT(*) as exists FROM information_schema.tables WHERE table_name = 'news_feed'
UNION ALL
SELECT 'bonus_tasks', COUNT(*) FROM information_schema.tables WHERE table_name = 'bonus_tasks'
UNION ALL
SELECT 'app_settings', COUNT(*) FROM information_schema.tables WHERE table_name = 'app_settings';
SELECT * FROM app_settings LIMIT 1;
SELECT COUNT(*) as news_count FROM news_feed;
SELECT COUNT(*) as task_count FROM bonus_tasks;
