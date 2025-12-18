#!/bin/bash

# Script de démarrage du backend SIGIR
# Usage: ./start_backend.sh [option]
# Options: start, stop, restart, test, init

cd "$(dirname "$0")"

BACKEND_DIR="/home/matrice95/RICE/backend"
LOG_FILE="/tmp/backend.log"
PORT=8000

case "${1:-start}" in
    start)
        echo "🚀 Démarrage du backend SIGIR..."
        echo ""
        
        # Vérifier si déjà en cours
        if lsof -ti:$PORT > /dev/null 2>&1; then
            echo "⚠️  Le backend est déjà en cours d'exécution sur le port $PORT"
            echo ""
            ps aux | grep uvicorn | grep -v grep | head -3
            echo ""
            echo "Utilisez './start_backend.sh stop' pour l'arrêter"
            exit 1
        fi
        
        # Démarrer
        cd "$BACKEND_DIR"
        python3 -m uvicorn main:app --reload --host 0.0.0.0 --port $PORT > "$LOG_FILE" 2>&1 &
        PID=$!
        
        echo "⏳ Attente du démarrage (5s)..."
        sleep 5
        
        # Vérifier
        if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
            echo "✅ Backend démarré avec succès !"
            echo ""
            echo "   URL: http://localhost:$PORT"
            echo "   Docs: http://localhost:$PORT/docs"
            echo "   PID: $PID"
            echo "   Logs: tail -f $LOG_FILE"
            echo ""
            echo "📋 Utilisateur test:"
            echo "   Phone: +2250707342607"
            echo "   Password: 1234"
        else
            echo "❌ Erreur au démarrage"
            echo ""
            echo "Logs d'erreur:"
            tail -30 "$LOG_FILE"
            exit 1
        fi
        ;;
        
    stop)
        echo "🛑 Arrêt du backend..."
        pkill -9 uvicorn
        sleep 1
        
        if lsof -ti:$PORT > /dev/null 2>&1; then
            echo "⚠️  Forcer l'arrêt..."
            lsof -ti:$PORT | xargs kill -9
        fi
        
        echo "✅ Backend arrêté"
        ;;
        
    restart)
        echo "🔄 Redémarrage du backend..."
        $0 stop
        sleep 2
        $0 start
        ;;
        
    test)
        echo "🧪 Test du backend..."
        echo ""
        
        # Vérifier si en cours
        if ! lsof -ti:$PORT > /dev/null 2>&1; then
            echo "❌ Le backend n'est pas en cours d'exécution"
            echo "Démarrez-le avec: ./start_backend.sh start"
            exit 1
        fi
        
        cd "$BACKEND_DIR"
        python3 test_all_endpoints.py
        ;;
        
    init)
        echo "🔧 Réinitialisation de la base de données..."
        cd "$BACKEND_DIR"
        python3 fix_backend.py
        ;;
        
    logs)
        echo "📋 Logs du backend (Ctrl+C pour quitter)..."
        tail -f "$LOG_FILE"
        ;;
        
    status)
        echo "📊 État du backend..."
        echo ""
        
        if lsof -ti:$PORT > /dev/null 2>&1; then
            echo "✅ Backend en cours d'exécution"
            echo ""
            ps aux | grep uvicorn | grep -v grep | head -3
            echo ""
            
            # Test health
            if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
                echo "✅ Health check OK"
            else
                echo "⚠️  Health check failed"
            fi
        else
            echo "❌ Backend arrêté"
        fi
        ;;
        
    *)
        echo "Usage: $0 {start|stop|restart|test|init|logs|status}"
        echo ""
        echo "Commandes:"
        echo "  start   - Démarrer le backend"
        echo "  stop    - Arrêter le backend"
        echo "  restart - Redémarrer le backend"
        echo "  test    - Tester tous les endpoints"
        echo "  init    - Réinitialiser la base de données"
        echo "  logs    - Voir les logs en temps réel"
        echo "  status  - Vérifier l'état du backend"
        exit 1
        ;;
esac
