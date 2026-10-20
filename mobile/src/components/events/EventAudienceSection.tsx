import { Separator } from "../ui/separator";
import { Text } from "../ui/text";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  TouchableOpacity as RNTouchableOpacity,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { Search, X } from "lucide-react-native";
import {
  listProfilesPage,
  type SearchableProfile,
} from "../../services/profileService";
import { useAuthStore } from "../../stores/useAuthStore";
import { resolveAudienceResponse } from "../../utils/audienceResults";

interface Props {
  isPublic: boolean;
  selectedAudience: SearchableProfile[];
  onVisibilityChange: (isPublic: boolean) => void;
  onAudienceChange: (profiles: SearchableProfile[]) => void;
  onSectionLayout: (event: LayoutChangeEvent) => void;
  onSearchFocus: () => void;
}

export default function EventAudienceSection({
  isPublic,
  selectedAudience,
  onVisibilityChange,
  onAudienceChange,
  onSectionLayout,
  onSearchFocus,
}: Props) {
  const { sessionRevision } = useAuthStore();
  const [audienceSearch, setAudienceSearch] = useState("");
  const [audienceResults, setAudienceResults] = useState<SearchableProfile[]>(
    [],
  );
  const [isLoadingAudience, setIsLoadingAudience] = useState(false);
  const [audiencePage, setAudiencePage] = useState(0);
  const [hasMoreAudience, setHasMoreAudience] = useState(false);
  const [audienceError, setAudienceError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const resultsRef = useRef(audienceResults);
  const selectedAudienceRef = useRef(selectedAudience);
  const isPublicRef = useRef(isPublic);
  const focusedRef = useRef(false);
  const searchChangedRef = useRef(false);

  resultsRef.current = audienceResults;
  selectedAudienceRef.current = selectedAudience;
  isPublicRef.current = isPublic;

  const loadAudienceCandidates = async (
    page: number,
    query: string,
    mode: "replace" | "append",
  ) => {
    if (!focusedRef.current || isPublicRef.current) return;

    const requestId = ++requestIdRef.current;
    const authRevision = sessionRevision;
    setIsLoadingAudience(true);
    setAudienceError(null);

    const { data, hasMore, error } = await listProfilesPage({
      query,
      page,
      pageSize: 10,
    });

    if (
      !focusedRef.current ||
      authRevision !== useAuthStore.getState().sessionRevision
    ) {
      return;
    }

    const resolution = resolveAudienceResponse({
      current: resultsRef.current,
      incoming: data ?? [],
      mode,
      page,
      hasMore,
      requestId,
      latestRequestId: requestIdRef.current,
      isPublic: isPublicRef.current,
    });

    if (!resolution.shouldApply) return;

    setIsLoadingAudience(false);

    if (error) {
      const message = "Não foi possível carregar os membros agora.";
      setAudienceError(message);
      Alert.alert("Erro", message);
      return;
    }

    setAudiencePage(resolution.page ?? 0);
    setHasMoreAudience(resolution.hasMore);
    setAudienceResults(resolution.results);
  };

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      setAudienceResults([]);
      setAudiencePage(0);
      setHasMoreAudience(false);
      setAudienceError(null);

      let timer: ReturnType<typeof setTimeout> | undefined;

      if (isPublic) {
        searchChangedRef.current = false;
        setAudienceSearch("");
        setIsLoadingAudience(false);
      } else {
        setIsLoadingAudience(true);
        const query = audienceSearch.trim();
        const shouldDebounce = searchChangedRef.current;
        searchChangedRef.current = false;
        if (shouldDebounce) {
          timer = setTimeout(
            () => void loadAudienceCandidates(0, query, "replace"),
            250,
          );
        } else {
          void loadAudienceCandidates(0, query, "replace");
        }
      }

      return () => {
        focusedRef.current = false;
        requestIdRef.current += 1;
        if (timer) clearTimeout(timer);
      };
    }, [audienceSearch, isPublic, sessionRevision]),
  );

  const handleSearchChange = (value: string) => {
    if (value === audienceSearch) return;
    // Invalidate immediately; the next request waits for the debounce.
    requestIdRef.current += 1;
    searchChangedRef.current = true;
    setAudienceSearch(value);
  };

  const selectedAudienceIds = new Set(
    selectedAudience.map((profile) => profile.id),
  );
  const availableAudienceResults = audienceResults.filter(
    (profile) => !selectedAudienceIds.has(profile.id),
  );

  const toggleAudienceMember = (profile: SearchableProfile) => {
    const current = selectedAudienceRef.current;
    const alreadySelected = current.some((member) => member.id === profile.id);
    const next = alreadySelected
      ? current.filter((member) => member.id !== profile.id)
      : [...current, profile];
    // Consecutive taps must accumulate before the shared form rerenders.
    selectedAudienceRef.current = next;
    onAudienceChange(next);
  };

  const removeAudienceMember = (profileId: string) => {
    const next = selectedAudienceRef.current.filter(
      (member) => member.id !== profileId,
    );
    selectedAudienceRef.current = next;
    onAudienceChange(next);
  };

  const handleLoadMoreAudience = async () => {
    if (isLoadingAudience || !hasMoreAudience) return;
    await loadAudienceCandidates(
      audiencePage + 1,
      audienceSearch.trim(),
      "append",
    );
  };

  return (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <Text style={{ fontSize: 16 }}>Evento público?</Text>
        <Switch
          checked={isPublic}
          onCheckedChange={onVisibilityChange}
          accessibilityLabel="Evento público"
        />
      </View>

      <Text
        style={{
          fontSize: 13,
          color: "#6b7280",
          lineHeight: 18,
          marginBottom: 20,
        }}
      >
        {isPublic
          ? "Todos os membros autenticados visualizam este evento."
          : selectedAudience.length === 0
            ? "Sem membros selecionados, apenas administradores visualizam este evento."
            : "Administradores e membros selecionados visualizam este evento."}
      </Text>

      {!isPublic ? (
        <View
          onLayout={onSectionLayout}
          style={{
            marginBottom: 24,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 20,
            padding: 16,
            gap: 14,
          }}
        >
          <View style={{ gap: 4 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#111827",
              }}
            >
              Membros que podem ver este evento
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: "#6b7280",
                lineHeight: 18,
              }}
            >
              Defina quem pode visualizar este evento privado.
            </Text>
          </View>

          <Input
            value={audienceSearch}
            onChangeText={handleSearchChange}
            onFocus={onSearchFocus}
            placeholder="Buscar membro por nome"
            left={
              <Search size={18} color="#6b7280" />
            }
          />

          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#374151",
              }}
            >
              Selecionados ({selectedAudience.length})
            </Text>

            {selectedAudience.length === 0 ? (
              <Text style={{ fontSize: 13, color: "#6b7280" }}>
                Nenhum membro selecionado. Se salvar assim, apenas
                administradores visualizam este evento.
              </Text>
            ) : (
              selectedAudience.map((profile) => (
                <View
                  key={profile.id}
                  style={{
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    borderRadius: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "600", color: "#111827" }}>
                      {profile.full_name}
                    </Text>
                    {!!profile.email ? (
                      <Text style={{ fontSize: 12, color: "#6b7280" }}>
                        {profile.email}
                      </Text>
                    ) : null}
                  </View>

                  <RNTouchableOpacity
                    onPress={() => removeAudienceMember(profile.id)}
                  >
                    <X size={18} color="#6b7280" />
                  </RNTouchableOpacity>
                </View>
              ))
            )}
          </View>

          <Separator />

          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#374151",
              }}
            >
              Membros disponíveis
            </Text>

            {audienceError ? (
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 13, color: "#b91c1c" }}>
                  {audienceError}
                </Text>
                <RNTouchableOpacity
                  onPress={() =>
                    void loadAudienceCandidates(
                      0,
                      audienceSearch.trim(),
                      "replace",
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: "#111827",
                    }}
                  >
                    Tentar novamente
                  </Text>
                </RNTouchableOpacity>
              </View>
            ) : null}

            {isLoadingAudience && availableAudienceResults.length === 0 ? (
              <Text style={{ fontSize: 13, color: "#6b7280" }}>
                Carregando membros...
              </Text>
            ) : availableAudienceResults.length === 0 ? (
              audienceError ? null : (
                <Text style={{ fontSize: 13, color: "#6b7280" }}>
                  {audienceSearch.trim()
                    ? "Nenhum membro encontrado para este termo."
                    : "Nenhum membro disponível para adicionar."}
                </Text>
              )
            ) : (
              <>
                {availableAudienceResults.map((profile) => (
                  <RNTouchableOpacity
                    key={profile.id}
                    onPress={() => toggleAudienceMember(profile)}
                    activeOpacity={0.8}
                    style={{
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                      borderRadius: 16,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "600", color: "#111827" }}>
                        {profile.full_name}
                      </Text>
                      {!!profile.email ? (
                        <Text style={{ fontSize: 12, color: "#6b7280" }}>
                          {profile.email}
                        </Text>
                      ) : null}
                    </View>

                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: "#111827",
                      }}
                    >
                      Adicionar
                    </Text>
                  </RNTouchableOpacity>
                ))}

                {hasMoreAudience ? (
                  <RNTouchableOpacity
                    onPress={() => void handleLoadMoreAudience()}
                    activeOpacity={0.8}
                    style={{
                      borderWidth: 1,
                      borderColor: "#d1d5db",
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: isLoadingAudience ? 0.7 : 1,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: "#111827",
                      }}
                    >
                      {isLoadingAudience
                        ? "Carregando..."
                        : "Carregar mais 10 membros"}
                    </Text>
                  </RNTouchableOpacity>
                ) : null}
              </>
            )}
          </View>
        </View>
      ) : null}
    </>
  );
}
