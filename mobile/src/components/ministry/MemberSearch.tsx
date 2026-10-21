import { colors } from "../../theme/colors";
import { Text } from "../ui/text";
import { Input } from "../ui/input";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { TouchableOpacity, View } from "react-native";

import {
  searchRegisteredUsers,
  type MinistryMemberWithCapabilities,
  type SearchableUser,
} from "../../services/ministryService";
import { useAuthStore } from "../../stores/useAuthStore";
import { getProfileInitials } from "../../utils/profileAvatar";

type Props = {
  ministryId: string;
  members: MinistryMemberWithCapabilities[];
  disabled: boolean;
  canOperate: () => boolean;
  onSelect: (user: SearchableUser) => void;
};

export default function MemberSearch({
  ministryId,
  members,
  disabled,
  canOperate,
  onSelect,
}: Props) {
  const { sessionRevision } = useAuthStore();
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchableUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchRevision = useRef(0);
  const focused = useRef(false);
  const isCurrentSession = useCallback(
    () =>
      focused.current &&
      useAuthStore.getState().sessionRevision === sessionRevision,
    [sessionRevision],
  );
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      searchRevision.current++;
      setSearchResults([]);
      setIsSearchingUsers(false);
      return () => {
        focused.current = false;
        searchRevision.current++;
      };
    }, []),
  );
  useEffect(() => {
    const request = ++searchRevision.current;
    setSearchResults([]);
    setSearchError(null);
    if (!showSearch || !search.trim() || !ministryId || !canOperate()) {
      setIsSearchingUsers(false);
      return;
    }
    const timer = setTimeout(() => {
      if (
        !isCurrentSession() ||
        !canOperate() ||
        request !== searchRevision.current
      )
        return;
      setIsSearchingUsers(true);
      void searchRegisteredUsers(search).then((result) => {
        if (
          !isCurrentSession() ||
          !canOperate() ||
          request !== searchRevision.current
        )
          return;
        setIsSearchingUsers(false);
        if (result.error) {
          setSearchError(
            "Nao foi possivel buscar usuarios. Tente novamente em alguns instantes.",
          );
          return;
        }
        const currentIds = new Set(members.map((member) => member.user_id));
        setSearchResults(
          (result.data ?? []).filter((user) => !currentIds.has(user.id)),
        );
      });
    }, 250);
    return () => {
      clearTimeout(timer);
      searchRevision.current++;
    };
  }, [search, showSearch, ministryId, members, isCurrentSession]);

  return (
    <>
      <TouchableOpacity
        disabled={disabled}
        onPress={() => {
          searchRevision.current++;
          setShowSearch((value) => !value);
          setSearchResults([]);
        }}
        style={{ paddingVertical: 16 }}
      >
        <Text style={{ fontWeight: "700" }}>Adicionar integrante</Text>
      </TouchableOpacity>
      {showSearch ? (
        <View>
          <Input
            value={search}
            onChangeText={(value) => {
              searchRevision.current++;
              setSearchResults([]);
              setSearch(value);
            }}
            placeholder="Buscar usuários cadastrados"
            containerStyle={{ marginBottom: 12 }}
            fieldClassName="bg-muted border-border"
          />
          {isSearchingUsers ? (
            <Text>Buscando usuarios...</Text>
          ) : searchError ? (
            <Text style={{ color: colors.destructive }}>{searchError}</Text>
          ) : searchResults.length === 0 ? (
            <Text>
              {search.trim()
                ? "Nenhum usuario elegivel encontrado."
                : "Digite para buscar usuários que ainda não estão neste ministério."}
            </Text>
          ) : (
            searchResults.map((user) => (
              <TouchableOpacity
                key={user.id}
                onPress={() => onSelect(user)}
                style={{ paddingVertical: 14 }}
              >
                <Text>
                  {getProfileInitials(user.full_name)} · {user.full_name} ·
                  Adicionar
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      ) : null}
    </>
  );
}
