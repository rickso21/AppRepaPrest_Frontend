import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";

import { useUserData } from "@/hooks/home/useUserData";
import AdCard from "../components/comunidad/AdCard";
import CreateCommentModal from "../components/comunidad/CreateCommentModal";
import CreatePostModal from "../components/comunidad/CreatePostModal";
import GroupHeader from "../components/comunidad/GroupHeader";
import MediaViewerModal from "../components/comunidad/MediaViewerModal";
import PostCard from "../components/comunidad/PostCard";
import UserProfileModal from "../components/comunidad/UserProfileModal";
import { useAds, type Ad } from "../hooks/comunidad/useAds";
import {
  useComunidad,
  type Publicacion,
} from "../hooks/comunidad/useComunidad";

const BRAND = "#940000";
const BG = "#0F0F17";
const ADS_EVERY = 4;

type FeedItem = { type: "post"; data: Publicacion } | { type: "ad"; data: Ad };
type Props = { route?: { params?: any } };

export default function Comunidad({ route }: Props) {
  const raw = route?.params ?? {};
  const user = useUserData(raw);

  const {
    grupo,
    imgGrupo,
    grupoData,
    grupos,
    publicaciones,
    baseUrl,
    loading,
    refreshing,
    enviando,
    progresoSubida,
    comprimiendo,
    progresoCompresion,
    scope,
    cambiarScope,
    modalPost,
    textoPost,
    imagenPost,
    videoPost,
    audioPost,
    grabando,
    duracionAudio,
    setTextoPost,
    abrirModalPost,
    cerrarModalPost,
    seleccionarImagen,
    seleccionarVideo,
    crearPublicacion,
    iniciarGrabacion,
    detenerGrabacion,
    cancelarAudio,
    modalComment,
    textoComment,
    setTextoComment,
    abrirModalComment,
    cerrarModalComment,
    enviarComentario,
    onRefresh,
    eliminarPublicacion,
    esMia,
    reaccionar,
  } = useComunidad();

  const { ads, registrarClick, registrarImpresion, recargarAds } = useAds();

  const [visibleIds, setVisibleIds] = useState<number[]>([]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const ids = viewableItems
        .filter((v) => (v.item as FeedItem).type === "post")
        .map((v) => ((v.item as FeedItem).data as Publicacion).id)
        .filter(Boolean);
      setVisibleIds(ids);

      // la impresión de un anuncio se cuenta cuando REALMENTE se ve
      //    (60 % visible durante 300 ms, según viewabilityConfig). Antes se
      //    registraban todos al descargarlos, se vieran o no, y no se registraba
      //    ninguno cuando venían de la caché.
      viewableItems.forEach((v) => {
        const it = v.item as FeedItem;
        if (it?.type === "ad") registrarImpresion(it.data.id);
      });
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
    minimumViewTime: 300,
  }).current;

  //useCallback en abrirVisor / cerrarVisor / abrirPerfil / cerrarPerfil
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerTipo, setViewerTipo] = useState<"image" | "video" | null>(null);
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const abrirVisor = useCallback((tipo: "image" | "video", uri: string) => {
    setViewerTipo(tipo);
    setViewerUri(uri);
    setViewerVisible(true);
  }, []);

  const cerrarVisor = useCallback(() => {
    setViewerVisible(false);
    setViewerTipo(null);
    setViewerUri(null);
  }, []);

  const [profileUserId, setProfileUserId] = useState<number | null>(null);
  const [profileVisible, setProfileVisible] = useState(false);

  const abrirPerfil = useCallback((userId: number) => {
    setProfileUserId(userId);
    setProfileVisible(true);
  }, []);

  const cerrarPerfil = useCallback(() => {
    setProfileVisible(false);
    setProfileUserId(null);
  }, []);

  // MEZCLAR PUBLICACIONES + ANUNCIOS
  const feed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];
    let adIndex = 0;

    publicaciones.forEach((pub, i) => {
      items.push({ type: "post", data: pub });
      if ((i + 1) % ADS_EVERY === 0 && adIndex < ads.length) {
        items.push({ type: "ad", data: ads[adIndex] });
        adIndex++;
      }
    });

    while (adIndex < ads.length) {
      items.push({ type: "ad", data: ads[adIndex] });
      adIndex++;
    }

    return items;
  }, [publicaciones, ads]);

  // ────────────────────────────────────────────────────────────
  // renderItem con useCallback (fuera del JSX)
  // ────────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => {
      if (item.type === "ad") {
        return <AdCard ad={item.data} onClicked={registrarClick} />;
      }
      return (
        <PostCard
          publicacion={item.data}
          baseUrl={baseUrl}
          esMio={esMia(item.data)}
          // mientras el visor a pantalla completa está abierto, el video
          // el feed se pausa (antes seguían sonando los dos a la vez).
          esVisible={!viewerVisible && visibleIds.includes(item.data.id)}
          scope={scope}
          onDelete={eliminarPublicacion}
          onComment={abrirModalComment}
          onReaccionar={reaccionar}
          onOpenMedia={abrirVisor}
          onOpenProfile={abrirPerfil}
        />
      );
    },
    [
      baseUrl,
      scope,
      esMia,
      visibleIds,
      viewerVisible,
      registrarClick,
      eliminarPublicacion,
      abrirModalComment,
      reaccionar,
      abrirVisor,
      abrirPerfil,
    ],
  );

  return (
    <View style={styles.container}>
      <GroupHeader
        grupo={grupo}
        imgGrupo={imgGrupo}
        totalPublicaciones={publicaciones.length}
        userAvatarUrl={user.avatarUrl}
        userName={user.nombreCompleto}
        scope={scope}
        grupos={grupos}
        onScopeChange={(s) => cambiarScope(s)}
        // se muestra "Actualizando..." solo mientras carga de verdad
        cargando={loading || refreshing}
        // Number("") y Number(null) valen 0 (no NaN), así que antes
        // se abría el perfil del usuario id 0 cuando el dato aún no existía.
        onAvatarPress={() => {
          const id = Number(user.id);
          if (Number.isFinite(id) && id > 0) abrirPerfil(id);
        }}
        onGroupPress={() => {
          const id = Number(grupoData?.admin?.id);
          if (Number.isFinite(id) && id > 0) abrirPerfil(id);
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={BRAND} size="large" />
        </View>
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(item) =>
            item.type === "post" ? `post-${item.data.id}` : `ad-${item.data.id}`
          }
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              // el pull-to-refresh también renueva los anuncios
              //    (antes quedaban en caché 10 min sin forma de refrescarlos).
              onRefresh={() => {
                onRefresh();
                recargarAds();
              }}
              tintColor={BRAND}
            />
          }
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={5}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons
                name="chatbubbles-outline"
                size={52}
                color="rgba(255,255,255,0.2)"
              />
              <Text style={styles.emptyText}>
                Aún no hay publicaciones en este grupo
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={abrirModalPost}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <CreatePostModal
        visible={modalPost}
        texto={textoPost}
        imagen={imagenPost}
        video={videoPost}
        audio={audioPost}
        enviando={enviando}
        grabando={grabando}
        duracionAudio={duracionAudio}
        progresoSubida={progresoSubida}
        comprimiendo={comprimiendo}
        progresoCompresion={progresoCompresion}
        onChangeTexto={setTextoPost}
        onPickImage={seleccionarImagen}
        onPickVideo={seleccionarVideo}
        onStartRecording={iniciarGrabacion}
        onStopRecording={detenerGrabacion}
        onCancelRecording={cancelarAudio}
        onClose={cerrarModalPost}
        onSubmit={crearPublicacion}
      />

      <CreateCommentModal
        visible={modalComment !== null}
        texto={textoComment}
        enviando={enviando}
        onChangeTexto={setTextoComment}
        onClose={cerrarModalComment}
        onSubmit={enviarComentario}
      />

      <MediaViewerModal
        visible={viewerVisible}
        tipo={viewerTipo}
        uri={viewerUri}
        onClose={cerrarVisor}
      />

      <UserProfileModal
        visible={profileVisible}
        userId={profileUserId}
        onClose={cerrarPerfil}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  center: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  emptyText: { color: "rgba(255,255,255,0.4)", fontSize: 13 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
