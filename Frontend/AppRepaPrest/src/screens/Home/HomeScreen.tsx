  // screens/HomeScreen.tsx
  import React, { useState, useRef, useEffect, useCallback } from 'react';
  import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    Pressable,
    ActivityIndicator,
    Platform,
    Dimensions,
    Alert,
    Vibration,
  } from 'react-native';
  import { Ionicons } from '@expo/vector-icons';
  import { WebView } from 'react-native-webview';
  import * as Location from 'expo-location';
  import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
  import { HomeTabParamList } from './Home';
  import AppHeader from '../../components/AppHeader';
  import { api } from '../../services/api';
  import * as SecureStore from 'expo-secure-store';
  import { SoundService } from '../../services/SoundService';

  type Props = BottomTabScreenProps<HomeTabParamList, 'Home'>;

  const { height } = Dimensions.get('window');

  const mapHTML = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { 
        height: 100%; 
        margin: 0; 
        padding: 0; 
        background: #1C1C28; 
      }
      .me-icon {
        background: #2196F3; 
        width: 24px; 
        height: 24px;
        border-radius: 50%; 
        border: 3px solid #fff;
        box-shadow: 0 0 15px rgba(33,150,243,0.9);
      }
      .rider-icon {
        background: #FF6B35; 
        width: 16px; 
        height: 16px;
        border-radius: 50%; 
        border: 2px solid #fff;
        box-shadow: 0 0 10px rgba(255,107,53,0.8);
      }
      .rider-icon.ocupado { background: #F59E0B; }
      .rider-icon.desconectado { background: #6B7280; opacity: 0.5; }
      .panic-icon {
        background: #FF0000; 
        width: 35px; 
        height: 35px;
        border-radius: 50%; 
        border: 3px solid #fff;
        box-shadow: 0 0 30px rgba(255,0,0,0.9);
        animation: pulse 1s infinite;
      }
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.3); opacity: 0.7; }
        100% { transform: scale(1); opacity: 1; }
      }
      .leaflet-popup-content { min-width: 120px; color: #fff; }
      .leaflet-popup-content-wrapper { background: #1C1C28; border-radius: 10px; }
      .leaflet-popup-tip { background: #1C1C28; }
      
      /* ========== CONTROLES DE ZOOM ========== */
      .custom-zoom-control {
        position: absolute;
        bottom: 30px;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 1000;
      }
      .custom-zoom-btn {
        background: rgba(28, 28, 40, 0.9);
        border: 1px solid rgba(255,255,255,0.15);
        color: #fff;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        font-size: 22px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        user-select: none;
      }
      .custom-zoom-btn:hover {
        background: rgba(255, 107, 53, 0.8);
      }
      .custom-zoom-btn:active {
        transform: scale(0.95);
      }
      
    .btn-centrar {
    position: absolute;
    bottom: 135px;  /* ← Aumentar este valor para subirlo */
    right: 20px;
    background: rgba(28, 28, 40, 0.9);
    border: 1px solid rgba(255,255,255,0.15);
    color: #fff;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 1000;
    user-select: none;
    transition: all 0.3s;
  }
      .btn-centrar:hover {
        background: rgba(33, 150, 243, 0.8);
      }
      .btn-centrar:active {
        transform: scale(0.95);
      }

      /* ========== BOTÓN DE NAVEGACIÓN EN POPUP ========== */
      .popup-navegar-btn {
        background: #FF6B35;
        color: #fff;
        border: none;
        padding: 10px 16px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        margin-top: 10px;
        width: 100%;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .popup-navegar-btn:hover {
        background: #FF8A5C;
        transform: scale(1.02);
      }
      .popup-navegar-btn:active {
        transform: scale(0.98);
      }

      /* ========== PANEL DE NAVEGACIÓN MEJORADO ========== */
    .navegacion-panel {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(20, 20, 30, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 14px;
    padding: 14px 16px;
    color: #fff;
    font-size: 12px;
    z-index: 999;
    display: none;
    min-width: 200px;
    max-width: 80%;
    width: auto;
    box-shadow: 0 8px 40px rgba(0,0,0,0.7);
    pointer-events: auto;
    transition: all 0.3s ease;
  }

  .navegacion-panel.visible {
    display: block;
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from { 
      opacity: 0; 
      transform: translate(-50%, -50%) scale(0.95);
    }
    to { 
      opacity: 1; 
      transform: translate(-50%, -50%) scale(1);
    }
  }

      
      .navegacion-panel .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .navegacion-panel .panel-titulo {
    font-size: 10px;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
  }

  .navegacion-panel .btn-cerrar-panel {
    background: rgba(255,255,255,0.1);
    border: none;
    color: #aaa;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
  }

  /* ========== DESTINO ========== */
  .navegacion-panel .destino-nombre {
    font-size: 13px;
    font-weight: bold;
    color: #FF6B35;
    margin-bottom: 4px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  /* ========== INFO DE RUTA ========== */
  .navegacion-panel .info-ruta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255,255,255,0.05);
    border-radius: 8px;
    padding: 4px 12px;
    margin: 4px 0;
  }

  .navegacion-panel .distancia-valor {
    font-size: 18px;
    font-weight: bold;
    color: #4CAF50;
  }

  .navegacion-panel .distancia-label {
    font-size: 11px;
    color: #aaa;
  }

  /* ========== INSTRUCCIÓN ========== */
  .navegacion-panel .instruccion {
    font-size: 12px;
    color: #fff;
    padding: 6px 10px;
    background: rgba(255,107,53,0.1);
    border-radius: 6px;
    border-left: 3px solid #FF6B35;
    margin: 4px 0;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ========== BOTONES DE ACCIÓN ========== */
  .navegacion-panel .panel-acciones {
    display: flex;
    gap: 6px;
    margin-top: 6px;
    justify-content: center;
  }

  .navegacion-panel .btn-accion {
    flex: 1;
    padding: 5px 10px;
    border-radius: 6px;
    border: none;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    text-align: center;
    white-space: nowrap;
  }

  .navegacion-panel .btn-voz {
    background: rgba(33, 150, 243, 0.3);
    border: 1px solid rgba(33, 150, 243, 0.3);
    color: #fff;
  }

  .navegacion-panel .btn-voz.activado {
    background: rgba(76, 175, 80, 0.3);
    border-color: rgba(76, 175, 80, 0.5);
  }

  .navegacion-panel .btn-cancelar-navegacion {
    background: rgba(255, 107, 53, 0.2);
    border: 1px solid rgba(255, 107, 53, 0.3);
    color: #FF6B35;
  }

  /* ========== RESPONSIVE PARA IPHONE ========== */
  @media (max-width: 414px) {
    .navegacion-panel {
      min-width: 160px;
      max-width: 85%;
      padding: 10px 12px;
      border-radius: 12px;
    }
    
    .navegacion-panel .panel-titulo {
      font-size: 9px;
    }
    
    .navegacion-panel .destino-nombre {
      font-size: 12px;
    }
    
    .navegacion-panel .distancia-valor {
      font-size: 16px;
    }
    
    .navegacion-panel .distancia-label {
      font-size: 10px;
    }
    
    .navegacion-panel .instruccion {
      font-size: 11px;
      padding: 4px 8px;
    }
    
    .navegacion-panel .btn-accion {
      font-size: 10px;
      padding: 4px 8px;
    }
    
    .navegacion-panel .btn-cerrar-panel {
      width: 22px;
      height: 22px;
      font-size: 12px;
    }
  }

  /* ========== PARA PANTALLAS MUY PEQUEÑAS (iPhone SE) ========== */
  @media (max-width: 375px) {
    .navegacion-panel {
      min-width: 140px;
      max-width: 90%;
      padding: 8px 10px;
    }
    
    .navegacion-panel .destino-nombre {
      font-size: 11px;
    }
    
    .navegacion-panel .distancia-valor {
      font-size: 14px;
    }
    
    .navegacion-panel .instruccion {
      font-size: 10px;
      padding: 3px 6px;
    }
    
    .navegacion-panel .btn-accion {
      font-size: 9px;
      padding: 3px 6px;
    }
  }
      /* ========== INDICADOR DE NAVEGACIÓN ACTIVA ========== */
      .navegacion-activa-indicator {
        position: absolute;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 107, 53, 0.9);
        color: #fff;
        padding: 4px 16px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: bold;
        z-index: 1000;
        display: none;
        letter-spacing: 1px;
        box-shadow: 0 4px 20px rgba(255, 107, 53, 0.4);
      }
      .navegacion-activa-indicator.visible {
        display: block;
        animation: pulseIndicator 2s infinite;
      }
      @keyframes pulseIndicator {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    
    <!-- ========== INDICADOR DE NAVEGACIÓN ACTIVA ========== -->
    <div class="navegacion-activa-indicator" id="navIndicator">
      🚗 Navegando...
    </div>
    
    <!-- ========== CONTROLES DE ZOOM ========== -->
    <div class="custom-zoom-control">
      <button class="custom-zoom-btn" onclick="window.zoomIn()" title="Acercar">+</button>
      <button class="custom-zoom-btn" onclick="window.zoomOut()" title="Alejar">−</button>
    </div>
    <button class="btn-centrar" onclick="window.centrarUbicacion()" title="Centrar en mi ubicación">📍</button>
    
    <!-- ========== PANEL DE NAVEGACIÓN ========== -->
    <div class="navegacion-panel" id="navegacionPanel">
      <div class="panel-header">
        <span class="panel-titulo">🚗 NAVEGACIÓN ACTIVA</span>
        <button class="btn-cerrar-panel" onclick="window.cerrarPanel()" title="Cerrar panel">✕</button>
      </div>
      <div class="destino-nombre" id="destinoNombre">Destino</div>
      <div class="info-ruta">
        <span class="distancia-label">📏 Distancia</span>
        <span class="distancia-valor" id="distanciaInfo">0.0 <span style="font-size:12px;color:#aaa;">km</span></span>
      </div>
      <div class="instruccion" id="instruccionActual">
        <span class="icono">📍</span>
        <span id="textoInstruccion">Preparando ruta...</span>
      </div>
      <div class="panel-acciones">
        <button class="btn-accion btn-voz" id="btnVoz" onclick="window.toggleVoz()">
          🔊 Voz
        </button>
        <button class="btn-accion btn-cancelar-navegacion" onclick="window.cancelarNavegacion()">
          ✕ Cancelar ruta
        </button>
      </div>
    </div>

    <!-- ========== SCRIPTS ========== -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      // ============================================
      // INICIALIZACIÓN DEL MAPA
      // ============================================
      const map = L.map('map', { 
        zoomControl: false,
        attributionControl: true
      }).setView([19.4326, -99.1332], 13);
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '© OpenStreetMap © CARTO'
      }).addTo(map);

      // ============================================
      // ICONOS
      // ============================================
      const meIcon = L.divIcon({ 
        className: '', 
        html: '<div class="me-icon"></div>', 
        iconSize: [24, 24] 
      });
      const riderIcon = L.divIcon({ 
        className: '', 
        html: '<div class="rider-icon"></div>', 
        iconSize: [16, 16] 
      });
      const riderIconOcupado = L.divIcon({ 
        className: '', 
        html: '<div class="rider-icon ocupado"></div>', 
        iconSize: [16, 16] 
      });
      const riderIconDesconectado = L.divIcon({ 
        className: '', 
        html: '<div class="rider-icon desconectado"></div>', 
        iconSize: [16, 16] 
      });
      const panicIcon = L.divIcon({ 
        className: '', 
        html: '<div class="panic-icon"></div>', 
        iconSize: [35, 35] 
      });

      // ============================================
      // VARIABLES GLOBALES
      // ============================================
      let meMarker = null;
      let riders = {};
      let panicMarkers = {};
      let currentUserLocation = null;
      let routeLine = null;
      let destinationMarker = null;
      let destinationData = null;
      let vozActivada = false;
      let speechSynth = null;
      let intervaloActualizacion = null;
      let navegacionActiva = false;

      // Inicializar Speech Synthesis
      if (window.speechSynthesis) {
        speechSynth = window.speechSynthesis;
      }

      // ============================================
      // FUNCIONES DE ZOOM
      // ============================================
      window.zoomIn = function() {
        map.zoomIn();
      };
      window.zoomOut = function() {
        map.zoomOut();
      };

      // ============================================
      // FUNCIÓN: CENTRAR UBICACIÓN
      // ============================================
      window.centrarUbicacion = function() {
        if (currentUserLocation) {
          map.setView([currentUserLocation.lat, currentUserLocation.lng], 15);
        }
      };

      // ============================================
      // FUNCIÓN: ACTUALIZAR MI UBICACIÓN
      // ============================================
      function updateMyLocation(lat, lng) {
        currentUserLocation = { lat: lat, lng: lng };
        if (!meMarker) {
          meMarker = L.marker([lat, lng], { icon: meIcon }).addTo(map);
          map.setView([lat, lng], 15);
        } else {
          meMarker.setLatLng([lat, lng]);
        }
        
        // Actualizar instrucciones si hay ruta activa
        if (navegacionActiva && destinationData) {
          actualizarInstrucciones();
        }
      }

      // ============================================
      // FUNCIÓN: CALCULAR DISTANCIA (Haversine)
      // ============================================
      function calcularDistancia(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      }

      // ============================================
      // FUNCIÓN: HABLAR (VOZ)
      // ============================================
      function hablar(texto) {
        if (!vozActivada || !speechSynth) return;
        
        speechSynth.cancel();
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'es-MX';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        const voces = speechSynth.getVoices();
        const vozEspañol = voces.find(v => v.lang.startsWith('es'));
        if (vozEspañol) {
          utterance.voice = vozEspañol;
        }
        
        speechSynth.speak(utterance);
      }

      // ============================================
      // FUNCIÓN: ACTUALIZAR INSTRUCCIONES
      // ============================================
      function actualizarInstrucciones() {
        if (!currentUserLocation || !destinationData) return;
        
        const dist = calcularDistancia(
          currentUserLocation.lat, 
          currentUserLocation.lng,
          destinationData.lat, 
          destinationData.lng
        );
        
        // Actualizar distancia
        document.getElementById('distanciaInfo').innerHTML = dist.toFixed(1) + ' <span style="font-size:12px;color:#aaa;">km</span>';
        
        // Determinar instrucción
        let instruccion = "Sigue la ruta hacia tu destino";
        let icono = "📍";
        
        if (dist < 0.05) {
          instruccion = "🎯 ¡Has llegado a tu destino!";
          icono = "🎯";
          if (vozActivada) hablar("Has llegado a tu destino");
        } else if (dist < 0.3) {
          instruccion = "👀 Estás muy cerca, el destino está a la vista";
          icono = "👀";
          if (dist < 0.2 && vozActivada) hablar("Estás muy cerca de tu destino");
        } else if (dist < 0.8) {
          instruccion = "⬆️ Continúa recto, el destino está cerca";
          icono = "⬆️";
        } else if (dist < 1.5) {
          instruccion = "🚗 Mantén la dirección actual, sigue recto";
          icono = "🚗";
        } else {
          instruccion = "🧭 Dirígete hacia el destino por esta vía";
          icono = "";
        }
        
        document.getElementById('textoInstruccion').textContent = instruccion;
        document.querySelector('.instruccion .icono').textContent = icono;
      }

      // ============================================
      // FUNCIÓN: MOSTRAR/OCULTAR INDICADOR
      // ============================================
      function mostrarIndicador(mostrar) {
        const indicator = document.getElementById('navIndicator');
        if (mostrar) {
          indicator.classList.add('visible');
        } else {
          indicator.classList.remove('visible');
        }
      }

      // ============================================
      // FUNCIÓN: NAVEGAR A REPARTIDOR
      // ============================================
      window.navigateTo = function(lat, lng, userName) {
        if (!currentUserLocation) {
          alert('Tu ubicación no está disponible');
          return;
        }

        // Limpiar navegación anterior
        limpiarNavegacion();
        
        // Guardar destino
        destinationData = { lat: lat, lng: lng, nombre: userName };
        navegacionActiva = true;

        // Crear marcador de destino
        destinationMarker = L.marker([lat, lng], { 
          icon: L.divIcon({
            className: '',
            html: '<div style="background:#FF0000;width:25px;height:25px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 30px rgba(255,0,0,0.9);animation:pulse 1s infinite;"></div>',
            iconSize: [25, 25]
          })
        }).addTo(map)
          .bindPopup('<strong style="color:#FF0000;">🚨 DESTINO</strong><br/><strong>' + userName + '</strong><br/><span style="color:#FF6B35;">¡Ayuda en camino!</span>')
          .openPopup();

        // Crear línea de ruta
        routeLine = L.polyline([
          [currentUserLocation.lat, currentUserLocation.lng],
          [lat, lng]
        ], {
          color: '#FF6B35',
          weight: 4,
          opacity: 0.8,
          dashArray: '10, 10'
        }).addTo(map);

        // Mostrar panel
        const panel = document.getElementById('navegacionPanel');
        panel.classList.add('visible');
        document.getElementById('destinoNombre').textContent = '📍 ' + userName;
        
        // Mostrar indicador
        mostrarIndicador(true);
        
        // Actualizar instrucciones
        actualizarInstrucciones();
        
        // Instrucción de voz inicial
        if (vozActivada) {
          const dist = calcularDistancia(
            currentUserLocation.lat, 
            currentUserLocation.lng,
            lat, 
            lng
          );
          hablar("Iniciando navegación hacia " + userName + ". Distancia: " + dist.toFixed(1) + " kilómetros");
        }

        // Ajustar vista
        const bounds = L.latLngBounds([
          [currentUserLocation.lat, currentUserLocation.lng],
          [lat, lng]
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });
        
        map.closePopup();

        // Iniciar actualización automática
        if (intervaloActualizacion) clearInterval(intervaloActualizacion);
        intervaloActualizacion = setInterval(function() {
          if (navegacionActiva) {
            actualizarInstrucciones();
          }
        }, 3000);
      };

      // ============================================
      // FUNCIÓN: TOGGLE VOZ
      // ============================================
      window.toggleVoz = function() {
        vozActivada = !vozActivada;
        const btn = document.getElementById('btnVoz');
        if (vozActivada) {
          btn.textContent = '🔊 Voz ON';
          btn.classList.add('activado');
          if (navegacionActiva && destinationData && currentUserLocation) {
            const dist = calcularDistancia(
              currentUserLocation.lat, 
              currentUserLocation.lng,
              destinationData.lat, 
              destinationData.lng
            );
            hablar("Navegación activada. Distancia: " + dist.toFixed(1) + " kilómetros");
          }
        } else {
          btn.textContent = '🔇 Voz OFF';
          btn.classList.remove('activado');
          if (speechSynth) {
            speechSynth.cancel();
          }
        }
      };

      // ============================================
      // FUNCIÓN: LIMPIAR NAVEGACIÓN (INTERNA)
      // ============================================
      function limpiarNavegacion() {
        if (routeLine) {
          map.removeLayer(routeLine);
          routeLine = null;
        }
        if (destinationMarker) {
          map.removeLayer(destinationMarker);
          destinationMarker = null;
        }
        if (intervaloActualizacion) {
          clearInterval(intervaloActualizacion);
          intervaloActualizacion = null;
        }
        if (speechSynth) {
          speechSynth.cancel();
        }
        destinationData = null;
        navegacionActiva = false;
        mostrarIndicador(false);
        
        // Resetear botón de voz (sin desactivar la voz)
        const btn = document.getElementById('btnVoz');
        if (!vozActivada) {
          btn.textContent = '🔊 Voz';
          btn.classList.remove('activado');
        }
      }

      // ============================================
      // FUNCIÓN: CERRAR PANEL (SOLO OCULTAR)
      // ============================================
      window.cerrarPanel = function() {
        const panel = document.getElementById('navegacionPanel');
        panel.classList.remove('visible');
        // La navegación sigue activa, solo se oculta el panel
      };

      // ============================================
      // FUNCIÓN: CANCELAR NAVEGACIÓN (COMPLETA)
      // ============================================
      window.cancelarNavegacion = function() {
        limpiarNavegacion();
        document.getElementById('navegacionPanel').classList.remove('visible');
        
        // Mostrar confirmación
        console.log('✅ Navegación cancelada');
      };

      // ============================================
      // FUNCIÓN: CANCELAR RUTA (ALIAS - MANTENER COMPATIBILIDAD)
      // ============================================
      window.cancelarRuta = window.cancelarNavegacion;

      // ============================================
      // FUNCIÓN: ACTUALIZAR REPARTIDOR
      // ============================================
      function updateRider(userId, userName, lat, lng, estado, enPanico, tipoEmergencia) {
        if (enPanico) {
          if (panicMarkers[userId]) {
            panicMarkers[userId].setLatLng([lat, lng]);
            panicMarkers[userId].setPopupContent(\`
              <strong style="color: #FF0000;">🚨 ALERTA DE PÁNICO</strong><br/>
              <strong>\${userName}</strong><br/>
              Tipo: \${tipoEmergencia || 'No especificado'}<br/>
              <span style="color: #FF6B35;">¡Necesita ayuda urgente!</span>
              <br/>
              <button class="popup-navegar-btn" onclick="window.navigateTo(\${lat}, \${lng}, '\${userName}')">
                🚗 Ir en camino
              </button>
            \`);
          } else {
            const marker = L.marker([lat, lng], { icon: panicIcon })
              .addTo(map)
              .bindPopup(\`
                <strong style="color: #FF0000;">🚨 ALERTA DE PÁNICO</strong><br/>
                <strong>\${userName}</strong><br/>
                Tipo: \${tipoEmergencia || 'No especificado'}<br/>
                <span style="color: #FF6B35;">¡Necesita ayuda urgente!</span>
                <br/>
                <button class="popup-navegar-btn" onclick="window.navigateTo(\${lat}, \${lng}, '\${userName}')">
                  🚗 Ir en camino
                </button>
              \`);
            panicMarkers[userId] = marker;
          }
          if (riders[userId]) {
            map.removeLayer(riders[userId]);
            delete riders[userId];
          }
          return;
        }

        if (panicMarkers[userId]) {
          map.removeLayer(panicMarkers[userId]);
          delete panicMarkers[userId];
        }

        let icon = riderIcon;
        if (estado === 'ocupado') icon = riderIconOcupado;
        if (estado === 'desconectado') icon = riderIconDesconectado;

        if (riders[userId]) {
          riders[userId].setLatLng([lat, lng]);
          riders[userId].setPopupContent(\`
            <strong>\${userName}</strong><br/>
            Estado: \${estado || 'Desconocido'}
            <br/>
            <button class="popup-navegar-btn" onclick="window.navigateTo(\${lat}, \${lng}, '\${userName}')">
              🚗 Ir en camino
            </button>
          \`);
        } else {
          const marker = L.marker([lat, lng], { icon: icon })
            .addTo(map)
            .bindPopup(\`
              <strong>\${userName}</strong><br/>
              Estado: \${estado || 'Desconocido'}
              <br/>
              <button class="popup-navegar-btn" onclick="window.navigateTo(\${lat}, \${lng}, '\${userName}')">
                🚗 Ir en camino
              </button>
            \`);
          riders[userId] = marker;
        }
      }

      // ============================================
      // FUNCIONES ADICIONALES
      // ============================================
      function removeRider(userId) {
        if (riders[userId]) {
          map.removeLayer(riders[userId]);
          delete riders[userId];
        }
        if (panicMarkers[userId]) {
          map.removeLayer(panicMarkers[userId]);
          delete panicMarkers[userId];
        }
      }

      function loadAllRiders(users) {
        users.forEach(function(user) {
          updateRider(user.id, user.nombre, user.latitud, user.longitud, user.estado, user.en_panico, user.tipo_emergencia);
        });
      }

      function clearAllRiders() {
        Object.keys(riders).forEach(function(key) {
          map.removeLayer(riders[key]);
          delete riders[key];
        });
        Object.keys(panicMarkers).forEach(function(key) {
          map.removeLayer(panicMarkers[key]);
          delete panicMarkers[key];
        });
      }

      // ============================================
      // EXPONER FUNCIONES AL WINDOW
      // ============================================
      window.updateMyLocation = updateMyLocation;
      window.updateRider = updateRider;
      window.removeRider = removeRider;
      window.loadAllRiders = loadAllRiders;
      window.clearAllRiders = clearAllRiders;
      window.navigateTo = window.navigateTo;
      window.cancelarNavegacion = window.cancelarNavegacion;
      window.cancelarRuta = window.cancelarNavegacion;
      window.cerrarPanel = window.cerrarPanel;
      window.toggleVoz = window.toggleVoz;
      
      console.log('🗺️ Mapa cargado con navegación independiente');
    </script>
  </body>
  </html>
  `;

  export default function HomeScreen({ route }: Props): JSX.Element {
    const { userName, userId } = route.params;

    // ========== ESTADOS ==========
    const [conectado, setConectado] = useState(false);
    const [sinPermiso, setSinPermiso] = useState(false);
    const [ubicacionLista, setUbicacionLista] = useState(false);
    const [panicoActivo, setPanicoActivo] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [alertasPanicoMostradas, setAlertasPanicoMostradas] = useState<Set<number>>(new Set()); 
    const [enviandoPanico, setEnviandoPanico] = useState(false);
    const [microfonoActivo, setMicrofonoActivo] = useState(false);

    // ========== REFS ==========
    const webviewRef = useRef<WebView>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const tokenRef = useRef<string | null>(null);

    // ========== OBTENER TOKEN ==========
    useEffect(() => {
      const getToken = async () => {
        try {
          const token = await SecureStore.getItemAsync('userToken');
          tokenRef.current = token;
        } catch (error) {
          //console.error('Error obteniendo token:', error);
        }
      };
      getToken();
    }, []);

    // ========== FUNCIONES API ==========

    const enviarUbicacion = useCallback(async (lat: number, lng: number) => {
      if (!tokenRef.current) {
        //console.log('No hay token');
        return;
      }
      try {
        //console.log('Enviando ubicación:', { lat, lng });
        //console.log('Token:', tokenRef.current.substring(0, 20) + '...');
        
        const response = await api.post('/mapa/ubicacion', { 
          latitud: lat, 
          longitud: lng 
        });
        
        //console.log('Respuesta ubicación:', response.data);
        
        if (response.data.res) setUbicacionLista(true);
      } catch (error: any) {
        //console.error(' Error enviando ubicación:', error?.response?.data || error.message);
      }
    }, []);

  const obtenerRepartidores = useCallback(async () => {
    if (!conectado) {
      //console.log('Usuario no conectado, omitiendo obtención de repartidores');
      return;
    }

    if (!tokenRef.current) {
      //console.log('No hay token');
      return;
    }
    
    try {
      const response = await api.get('/mapa/repartidores');
      
      if (response.data.res && webviewRef.current) {
        // Filtrar solo usuarios CONECTADOS (estado = 'disponible')
        const usuariosConectados = response.data.data;


        const usuariosActivos = usuariosConectados.filter((user: any) => 
          user.estado === 'conectado' || user.en_panico === true
        );
        
        const cantidad = usuariosConectados.length;
        //console.log(`Repartidores CONECTADOS encontrados: ${cantidad}`);
        
        // Si hay usuarios en pánico entre los conectados
        const usuariosEnPanico = usuariosConectados.filter((user: any) => user.en_panico === true);
        
        if (usuariosEnPanico.length > 0) {
          //console.log('Usuarios en pánico:', usuariosEnPanico.length);
          
          usuariosEnPanico.forEach((user: any) => {
            if (!alertasPanicoMostradas.has(user.id)) {
              //console.log(`Alarma de pánico para: ${user.nombre}`);
              setAlertasPanicoMostradas(prev => new Set(prev).add(user.id));
              SoundService.playAlarma();
              Vibration.vibrate([500, 200, 500, 200, 500, 200, 1000]);
              
              Alert.alert(
                'ALERTA DE PÁNICO',
                `${user.nombre} ha activado una alerta de pánico!\n\n📍 Ubicación: ${user.latitud}, ${user.longitud}\n🆘 Tipo: ${user.tipo_emergencia || 'No especificado'}`,
                [
                  { 
                    text: 'VER EN MAPA', 
                    onPress: () => {
                      if (webviewRef.current) {
                        webviewRef.current.injectJavaScript(`
                          map.setView([${user.latitud}, ${user.longitud}], 15);
                          true;
                        `);
                      }
                    }
                  },
                  { 
                    text: 'OK', 
                    style: 'cancel'
                  }
                ]
              );
            }
          });
        } else {
          setAlertasPanicoMostradas(new Set());
        }
        
        // Actualizar el mapa SOLO con usuarios conectados
        webviewRef.current.injectJavaScript(`
          window.clearAllRiders();
          window.loadAllRiders(${JSON.stringify(usuariosActivos)});
          true;
        `);
      }
    } catch (error: any) {
      //console.error('Error:', error?.response?.data || error.message);
    }
  }, [conectado, userId, userName, alertasPanicoMostradas]);

    const cambiarEstado = useCallback(async (estado: 'conectado' | 'desconectado') => {
      if (!tokenRef.current) return;
      try {
        const response = await api.post('/mapa/estado', { estado });
        return response.data;
      } catch (error: any) {
        //console.error('Error cambiando estado:', error?.response?.data || error.message);
        throw error;
      }
    }, []);

    const togglePanicoAPI = useCallback(async (accion: 'activar' | 'desactivar', data?: any) => {
      if (!tokenRef.current) return;
      try {
        const response = await api.post('/mapa/panico', { accion, ...data });
        return response.data;
      } catch (error: any) {
        //console.error('Error en pánico:', error?.response?.data || error.message);
        throw error;
      }
    }, []);

    // ========== INICIAR MONITOREO (SOLO UBICACIÓN) ==========
    const iniciarMonitoreo = useCallback(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setSinPermiso(true);
        return;
      }
      setSinPermiso(false);

      try {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const { latitude, longitude } = location.coords;

        await enviarUbicacion(latitude, longitude);

        if (webviewRef.current) {
          webviewRef.current.injectJavaScript(`
            window.updateMyLocation(${latitude}, ${longitude});
            true;
          `);
        }

        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(async () => {
          try {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const { latitude: lat, longitude: lng } = loc.coords;

            await enviarUbicacion(lat, lng);
            
            if (webviewRef.current) {
              webviewRef.current.injectJavaScript(`
                window.updateMyLocation(${lat}, ${lng});
                true;
              `);
            }
          } catch (error) {
            //console.error('Error en intervalo de ubicación:', error);
          }
        }, 5000);

      } catch (error) {
        //console.error('Error iniciando monitoreo:', error);
        Alert.alert('Error', 'No se pudo iniciar el monitoreo de ubicación');
      }
    }, [enviarUbicacion]);

   useEffect(() => {
  let repartidoresInterval: NodeJS.Timeout | null = null;
  
  if (conectado) {    
    // Obtener repartidores inmediatamente al conectar
    obtenerRepartidores();
    
    // Configurar intervalo
    repartidoresInterval = setInterval(() => {
      obtenerRepartidores();
    }, 3000);
  } else {
  
    if (webviewRef.current) {
      webviewRef.current.injectJavaScript(`
        window.clearAllRiders();
        true;
      `);
    }
  }
  
  return () => {
    if (repartidoresInterval) {
      clearInterval(repartidoresInterval);
    }
  };
}, [conectado, obtenerRepartidores]);

    // ========== CONECTAR/DESCONECTAR ==========
    const toggleConexion = async () => {
      setCargando(true);
      const nuevoEstado = conectado ? 'desconectado' : 'conectado';

      try {
          const data = await cambiarEstado(nuevoEstado);
          //console.log('Respuesta cambiar estado:', data); // DEBUG
          
          if (data?.res) {
              setConectado(nuevoEstado === 'conectado');

              if (nuevoEstado === 'conectado') {
                  await iniciarMonitoreo();
                  setTimeout(() => {
                      obtenerRepartidores();
                  }, 1000);
              } else {
                  if (intervalRef.current) {
                      clearInterval(intervalRef.current);
                      intervalRef.current = null;
                  }
                  setUbicacionLista(false);

                  if (webviewRef.current) {
                      webviewRef.current.injectJavaScript(`
                          window.clearAllRiders();
                          true;
                      `);
                  }
              }
          } else {
              Alert.alert('Error', data?.msg || 'No se pudo cambiar el estado');
          }
      } catch (error: any) {
          console.error('Error en toggleConexion:', error);
          Alert.alert('Error', 'Ocurrió un error al cambiar el estado');
      }
      setCargando(false);
  };

  // ========== DESACTIVAR PÁNICO DIRECTO ==========
  const desactivarPanicoDirecto = useCallback(async () => {
    try {
      // Detener sonidos y vibración
      await SoundService.stopAll();
      Vibration.cancel();
      
      // Enviar desactivación al backend
      const response = await togglePanicoAPI('desactivar', { accion: 'desactivar' });
      
      if (response?.res) {
        setPanicoActivo(false);
        
        // Sonido de confirmación
        await SoundService.playConfirmacion();
        
        Alert.alert(
          'ALERTA DESACTIVADA',
          'La alerta de pánico ha sido desactivada correctamente.',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert('Error', response?.msg || 'No se pudo desactivar la alerta');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al desactivar la alerta');
    }
  }, [togglePanicoAPI]);

    // ========== PÁNICO CON SONIDO Y VIBRACIÓN ==========
  const togglePanico = async () => {
    // Evitar múltiples envíos simultáneos
    if (enviandoPanico) {
      return;
    }

    if (!conectado) {
      Alert.alert('Error', 'Conéctate primero para usar el botón de pánico');
      return;
    }

    // Si ya está activo, usar desactivación directa
    if (panicoActivo) {
      await desactivarPanicoDirecto();
      return;
    }

    setCargando(true);
    setEnviandoPanico(true);

    try {
      const accion = 'activar';
      let data: any = { accion };

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      data.latitud = location.coords.latitude;
      data.longitud = location.coords.longitude;
      data.tipo_emergencia = 'asaltado';

      // Enviar al backend
      const response = await togglePanicoAPI(accion, data);

      if (response?.res) {
        setPanicoActivo(true);
        
        // Sonidos y vibración
        await SoundService.playAlarma();
        Vibration.vibrate([500, 200, 500, 200, 500, 200, 1000]);
        
        // Mostrar alerta con opciones
        Alert.alert(
          'ALERTA DE PELIGRO ACTIVO',
          'Se ha notificado a todos los repartidores cercanos.',
          [
            { 
              text: 'DESACTIVAR ALERTA', 
              onPress: () => {
                // Llamar a desactivación directa
                desactivarPanicoDirecto();
              },
              style: 'destructive' 
            },
            
            { text: 'OK', style: 'cancel' }
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert('Error', response?.msg || 'No se pudo activar la alerta');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al activar el pánico');
    }
    
    setCargando(false);
    setEnviandoPanico(false);
  };

    // ========== LIMPIEZA ==========
    useEffect(() => {
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        SoundService.stopAll();
      };
    }, []);



    // ========== FUNCIÓN PARA MICRÓFONO ==========
const toggleMicrofono = useCallback(async () => {
  if (!conectado) {
    Alert.alert('Error', 'Conéctate primero para usar el micrófono');
    return;
  }

  if (microfonoActivo) {
    // Desactivar micrófono
    setMicrofonoActivo(false);
    Alert.alert('Micrófono', 'Micrófono desactivado');
  } else {
    // Activar micrófono
    setMicrofonoActivo(true);
    Alert.alert('🎤 Micrófono Activado', 'Escuchando comandos de voz...');
  }
}, [conectado, microfonoActivo]);

    // ========== RENDER ==========
    return (
      <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? 49 : 0 }]}>
        <AppHeader userName={userName} subtitle="MONITOREO EN VIVO" />

        <View style={[styles.mapWrapper, Platform.OS === 'android' && { height: height * 0.53 }]}>
          <View style={styles.mapCard}>
            <WebView
              ref={webviewRef}
              originWhitelist={['*']}
              source={{ html: mapHTML }}
              style={styles.webview}
              scrollEnabled={false}
              onLoadEnd={() => {
                if (conectado) iniciarMonitoreo();
              }}
            />

            {!ubicacionLista && !sinPermiso && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color="#FF6B35" size="small" />
                <Text style={styles.loadingText}>Conectando GPS...</Text>
              </View>
            )}
  {/*
            <View style={styles.mapBadge}>
              <Text style={styles.mapBadgeLabel}>👤 {userName}</Text>
            </View>
  */}
              <View style={[styles.statusBadge, styles.statusBadgeLeft, conectado ? styles.statusConectado : styles.statusDesconectado]}>
            <View style={[styles.statusDot, conectado && styles.statusDotVerde]} />
            <Text style={styles.statusBadgeText}>{conectado ? 'En línea' : 'Desconectado'}</Text>
          </View>
        </View>
      </View>

       <View style={styles.bottomZone}>
  {/* Contenedor de botones principales (CONECTAR + MICRÓFONO) */}
  <View style={styles.buttonRow}>
    {/* Botón CONECTAR/DESCONECTAR */}
    <Pressable
      style={[styles.mainButton, conectado && styles.mainButtonActive, styles.flexButton]}
      onPress={toggleConexion}
      disabled={cargando}
    >
      {cargando ? (
        <ActivityIndicator color={conectado ? '#4CAF50' : '#fff'} size="small" />
      ) : (
        <>
          <Ionicons 
            name={conectado ? 'power' : 'flash'} 
            size={22} 
            color={conectado ? '#4CAF50' : '#fff'} 
          />
          <Text style={[styles.mainButtonText, conectado && styles.mainButtonTextActive]}>
            {conectado ? 'DESCONECTAR' : 'CONECTAR'}
          </Text>
        </>
      )}
    </Pressable>

    {/* Botón MICRÓFONO */}
    <Pressable
      style={[
        styles.microfonoButton,
        microfonoActivo && styles.microfonoButtonActive,
        !conectado && styles.microfonoButtonDisabled
      ]}
      onPress={toggleMicrofono}
      disabled={!conectado}
    >
      <Ionicons 
        name={microfonoActivo ? 'mic' : 'mic-outline'} 
        size={28} 
        color={microfonoActivo ? '#4CAF50' : '#fff'} 
      />
      {microfonoActivo && (
        <View style={styles.microfonoIndicador}>
          <View style={styles.puntoParpadeanteMic} />
        </View>
      )}
    </Pressable>
  </View>

  {/* Botón PÁNICO */}
  <Pressable
    style={[
      styles.panicoButton, 
      panicoActivo && styles.panicoButtonActivo, 
      !conectado && styles.panicoButtonDisabled
    ]}
    onPress={togglePanico}
    disabled={cargando || !conectado}
  >
    <Ionicons name={panicoActivo ? 'alert-circle' : 'warning'} size={28} color="#000000" />
    <Text style={styles.panicoText}>
      {panicoActivo ? '¡PÁNICO ACTIVO!' : 'PELIGRO'}
    </Text>
    {panicoActivo && (
      <View style={styles.panicoIndicador}>
        <View style={styles.puntoParpadeante} />
      </View>
    )}
  </Pressable>

  {!conectado && (
    <Text style={styles.ayudaTexto}>Conéctate para ver a tu agrupacion buen camino!</Text>
  )}
</View>
      </SafeAreaView>
    );
  }

  // ========== ESTILOS ==========

  //comentarios
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F0F17' },
    mapWrapper: {
      marginHorizontal: 20,
      marginBottom: Platform.OS === 'android' ? 12 : 6,
      borderRadius: 22,
      overflow: 'hidden',
      ...(Platform.OS === 'ios' && { flex: 1 }),
    },
    mapCard: {
      height: '100%',
      backgroundColor: '#1C1C28',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      overflow: 'hidden',
    },
    webview: { flex: 1, backgroundColor: '#1C1C28' },
    loadingOverlay: {
      position: 'absolute',
      top: 14,
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(15,15,23,0.92)',
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,107,53,0.3)',
    },
    loadingText: { fontSize: 12.5, color: '#fff', fontWeight: '600' },
    mapBadge: {
      position: 'absolute',
      bottom: 16,
      left: 16,
      backgroundColor: 'rgba(15,15,23,0.9)',
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },


    
    mapBadgeLabel: { fontSize: 12, color: '#fff', fontWeight: '600' },

    statusBadge: {
      position: 'absolute',
      top: 14,
      right: 14,  // ← Original (Derecha)
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(15,15,23,0.9)',
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
      statusBadgeLeft: {
    right: 'auto',
    left: 14,
    zIndex: 10,
    // ⬇️ SEPARADO POR PLATAFORMA
    top: Platform.select({
      ios: 315,      // iPhone: más abajo por el notch
      android: 410,  // Android: más arriba
      default: 55,
    }),
  },
    
    statusBadgeBottom: {
      top: 'auto',
      right: 14,
      bottom: 14,  // ← Alinear con mapBadge
    },
    
    statusConectado: { borderColor: 'rgba(76,175,80,0.4)' },
    statusDesconectado: { borderColor: 'rgba(107,114,128,0.4)' },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6B7280' },
    statusDotVerde: { backgroundColor: '#4CAF50' },
    statusBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },

      buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },

  // Botón flexible (CONECTAR/DESCONECTAR)
  flexButton: {
    flex: 1,
  },

  // Botón de micrófono
  microfonoButton: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  microfonoButtonActive: {
    backgroundColor: 'rgba(76,175,80,0.15)',
    borderColor: 'rgba(76,175,80,0.4)',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.6,
  },

  microfonoButtonDisabled: {
    opacity: 0.4,
  },

  microfonoIndicador: {
    position: 'absolute',
    top: -4,
    right: -4,
  },

  puntoParpadeanteMic: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },

    bottomZone: { paddingHorizontal: 20, paddingBottom: 8, gap: 12 },
    mainButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FF6B35',
      paddingVertical: 18,
      borderRadius: 16,
      gap: 10,
      shadowColor: '#FF6B35',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 16,
      elevation: 10,
    },
    mainButtonActive: {
      backgroundColor: 'rgba(76,175,80,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(76,175,80,0.4)',
      shadowOpacity: 0,
      elevation: 0,
    },
    mainButtonText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1.5 },
    mainButtonTextActive: { color: '#4CAF50' },
    panicoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#DC2626',
      paddingVertical: 14,
      borderRadius: 16,
      gap: 10,
      opacity: 0.8,
    },
    panicoButtonActivo: {
      opacity: 1,
      backgroundColor: '#B91C1C',
      shadowColor: '#DC2626',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 20,
      elevation: 15,
    },
    panicoButtonDisabled: { opacity: 0.4 },
    panicoText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
    panicoIndicador: { position: 'absolute', right: 12, top: '50%', transform: [{ translateY: -4 }] },
    puntoParpadeante: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FF0000',
      shadowColor: '#FF0000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 8,
    },
    ayudaTexto: { textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  });